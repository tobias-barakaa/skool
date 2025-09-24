import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateInvoiceInput, UpdateInvoiceInput } from './dtos/create-invoice.input';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { Invoice, InvoiceStatus } from './invoice.entity';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    private readonly dataSource: DataSource,
  ) {}

  async create(input: CreateInvoiceInput, user: ActiveUserData): Promise<Invoice> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const invoiceNumber = await this.generateInvoiceNumber(user.tenantId);

      const balance = input.totalAmount;

      const invoice = this.invoiceRepository.create({
        ...input,
        invoiceNumber,
        balance,
        tenantId: user.tenantId,
        createdBy: user.sub,
        issueDate: new Date(),
        dueDate: new Date(input.dueDate),
        status: InvoiceStatus.PENDING,
      });

      const savedInvoice = await queryRunner.manager.save(invoice);
      await queryRunner.commitTransaction();

      this.logger.log(`Invoice ${invoiceNumber} created successfully for tenant ${user.tenantId}`);
      return this.findOne(savedInvoice.id, user);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to create invoice: ${error.message}`);
      throw new BadRequestException('Failed to create invoice');
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(user: ActiveUserData): Promise<Invoice[]> {
    return await this.invoiceRepository.find({
      where: { tenantId: user.tenantId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, user: ActiveUserData): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id, tenantId: user.tenantId, isActive: true },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  async findByStudent(studentId: string, user: ActiveUserData): Promise<Invoice[]> {
    return await this.invoiceRepository.find({
      where: { studentId, tenantId: user.tenantId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findByStatus(status: InvoiceStatus, user: ActiveUserData): Promise<Invoice[]> {
    return await this.invoiceRepository.find({
      where: { status, tenantId: user.tenantId, isActive: true },
      order: { dueDate: 'ASC' },
    });
  }

  async findOverdueInvoices(user: ActiveUserData): Promise<Invoice[]> {
    const today = new Date();
    return await this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.tenantId = :tenantId', { tenantId: user.tenantId })
      .andWhere('invoice.isActive = :isActive', { isActive: true })
      .andWhere('invoice.dueDate < :today', { today })
      .andWhere('invoice.status IN (:...statuses)', { 
        statuses: [InvoiceStatus.PENDING, InvoiceStatus.PARTIALLY_PAID] 
      })
      .orderBy('invoice.dueDate', 'ASC')
      .getMany();
  }

  async update(id: string, input: UpdateInvoiceInput, user: ActiveUserData): Promise<Invoice> {
    const invoice = await this.findOne(id, user);
  
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Cannot update a fully paid invoice');
    }
  
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
  
    try {
      const updateData: Partial<Invoice> = {};
  
      if (input.totalAmount !== undefined) {
        updateData.totalAmount = input.totalAmount;
      }
  
      if (input.dueDate) {
        updateData.dueDate = new Date(input.dueDate);
      }
  
      if (input.description !== undefined) {
        updateData.description = input.description;
      }
  
      if (input.isActive !== undefined) {
        updateData.isActive = input.isActive;
      }
  
      if (input.totalAmount !== undefined && input.totalAmount !== invoice.totalAmount) {
        updateData.balance = input.totalAmount - invoice.paidAmount;
  
        if (updateData.balance <= 0) {
          updateData.status = InvoiceStatus.PAID;
        } else if (updateData.balance < input.totalAmount) {
          updateData.status = InvoiceStatus.PARTIALLY_PAID;
        } else {
          updateData.status = InvoiceStatus.PENDING;
        }
      }
  
      await queryRunner.manager.update(Invoice, id, updateData);
      await queryRunner.commitTransaction();
  
      this.logger.log(`Invoice ${id} updated successfully`);
      return this.findOne(id, user);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to update invoice ${id}: ${error.message}`);
      throw new BadRequestException('Failed to update invoice');
    } finally {
      await queryRunner.release();
    }
  }
  

  async updatePaymentStatus(id: string, paidAmount: number, user: ActiveUserData): Promise<Invoice> {
    const invoice = await this.findOne(id, user);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const newBalance = invoice.totalAmount - paidAmount;
      let status: InvoiceStatus;

      if (newBalance <= 0) {
        status = InvoiceStatus.PAID;
      } else if (paidAmount > 0) {
        status = InvoiceStatus.PARTIALLY_PAID;
      } else {
        status = InvoiceStatus.PENDING;
      }

      await queryRunner.manager.update(Invoice, id, {
        paidAmount,
        balance: Math.max(0, newBalance),
        status,
      });

      await queryRunner.commitTransaction();
      this.logger.log(`Invoice ${id} payment status updated: paid=${paidAmount}, balance=${newBalance}`);
      return this.findOne(id, user);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to update payment status for invoice ${id}: ${error.message}`);
      throw new BadRequestException('Failed to update payment status');
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string, user: ActiveUserData): Promise<boolean> {
    const invoice = await this.findOne(id, user);

    if (invoice.paidAmount > 0) {
      throw new BadRequestException('Cannot delete an invoice that has payments');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.update(Invoice, id, { isActive: false });
      await queryRunner.commitTransaction();

      this.logger.log(`Invoice ${id} deleted successfully`);
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to delete invoice ${id}: ${error.message}`);
      throw new BadRequestException('Failed to delete invoice');
    } finally {
      await queryRunner.release();
    }
  }

  private async generateInvoiceNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.invoiceRepository.count({
      where: { tenantId },
    });

    return `INV-${year}-${String(count + 1).padStart(6, '0')}`;
  }
}