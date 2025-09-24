
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { CreatePaymentInput, UpdatePaymentInput } from './dtos/create-payment.input';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { Invoice } from '../invoice/invoice.entity';
import { InvoiceService } from '../invoice/invoice.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    private readonly dataSource: DataSource,
    private readonly invoiceService: InvoiceService,
  ) {}

  async create(input: CreatePaymentInput, user: ActiveUserData): Promise<Payment> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const referenceNumber = await this.generateReferenceNumber(user.tenantId);

      let invoice: Invoice | null = null;

      if (input.invoiceId) {
        invoice = await this.invoiceRepository.findOne({
          where: { id: input.invoiceId, tenantId: user.tenantId, isActive: true },
        });

        if (!invoice) {
          throw new BadRequestException('Invoice not found');
        }

        if (invoice.studentId !== input.studentId) {
          throw new BadRequestException('Payment student does not match invoice student');
        }

        if (input.amount > invoice.balance) {
          throw new BadRequestException(
            `Payment amount (${input.amount}) exceeds invoice balance (${invoice.balance})`
          );
        }
      }

      const payment = this.paymentRepository.create({
        ...input,
        referenceNumber,
        tenantId: user.tenantId,
        recordedBy: user.sub,
        paymentDate: new Date(input.paymentDate),
        status: PaymentStatus.COMPLETED, 
      });

      const savedPayment = await queryRunner.manager.save(payment);
      if (invoice) {
        const newPaidAmount = Number(invoice.paidAmount) + Number(input.amount);
        await this.invoiceService.updatePaymentStatus(invoice.id, newPaidAmount, user);
      }

      await queryRunner.commitTransaction();

      this.logger.log(`Payment ${referenceNumber} created successfully for tenant ${user.tenantId}`);
      return this.findOne(savedPayment.id, user);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to create payment: ${error.message}`);
      throw error instanceof BadRequestException ? error : new BadRequestException('Failed to create payment');
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(user: ActiveUserData): Promise<Payment[]> {
    return await this.paymentRepository.find({
      where: { tenantId: user.tenantId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, user: ActiveUserData): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id, tenantId: user.tenantId, isActive: true },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async findByStudent(studentId: string, user: ActiveUserData): Promise<Payment[]> {
    return await this.paymentRepository.find({
      where: { studentId, tenantId: user.tenantId, isActive: true },
      order: { paymentDate: 'DESC' },
    });
  }

  async findByInvoice(invoiceId: string, user: ActiveUserData): Promise<Payment[]> {
    return await this.paymentRepository.find({
      where: { invoiceId, tenantId: user.tenantId, isActive: true },
      order: { paymentDate: 'DESC' },
    });
  }

  async findByStatus(status: PaymentStatus, user: ActiveUserData): Promise<Payment[]> {
    return await this.paymentRepository.find({
      where: { status, tenantId: user.tenantId, isActive: true },
      order: { paymentDate: 'DESC' },
    });
  }

  async findByReferenceNumber(referenceNumber: string, user: ActiveUserData): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { referenceNumber, tenantId: user.tenantId, isActive: true },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with reference number ${referenceNumber} not found`);
    }

    return payment;
  }

  async getPaymentSummaryByStudent(studentId: string, user: ActiveUserData): Promise<{
    totalPaid: number;
    totalPending: number;
    totalRefunded: number;
    paymentCount: number;
  }> {
    const payments = await this.findByStudent(studentId, user);

    const summary = payments.reduce(
      (acc, payment) => {
        acc.paymentCount++;
        
        switch (payment.status) {
          case PaymentStatus.COMPLETED:
            acc.totalPaid += Number(payment.amount);
            break;
          case PaymentStatus.PENDING:
            acc.totalPending += Number(payment.amount);
            break;
          case PaymentStatus.REFUNDED:
            acc.totalRefunded += Number(payment.amount);
            break;
        }
        
        return acc;
      },
      { totalPaid: 0, totalPending: 0, totalRefunded: 0, paymentCount: 0 }
    );

    return summary;
  }

  async update(id: string, input: UpdatePaymentInput, user: ActiveUserData): Promise<Payment> {
    const payment = await this.findOne(id, user);
  
    if (payment.status === PaymentStatus.REFUNDED) {
      throw new BadRequestException('Cannot update a refunded payment');
    }
  
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
  
    try {
      const updateData: Partial<Payment> = {};
  
      if (input.amount !== undefined) {
        updateData.amount = input.amount;
      }
  
      if (input.paymentMethod !== undefined) {
        updateData.paymentMethod = input.paymentMethod;
      }
  
      if (input.status !== undefined) {
        updateData.status = input.status;
      }
  
      if (input.paymentDate) {
        updateData.paymentDate = new Date(input.paymentDate);
      }
  
      if (input.transactionId !== undefined) {
        updateData.transactionId = input.transactionId;
      }
  
      if (input.notes !== undefined) {
        updateData.notes = input.notes;
      }
  
      if (input.isActive !== undefined) {
        updateData.isActive = input.isActive;
      }
  
      if (input.amount !== undefined && input.amount !== payment.amount && payment.invoiceId) {
        const invoice = await this.invoiceRepository.findOne({
          where: { id: payment.invoiceId, tenantId: user.tenantId },
        });
  
        if (invoice) {
          const amountDifference = Number(input.amount) - Number(payment.amount);
          const newPaidAmount = Number(invoice.paidAmount) + amountDifference;
  
          if (newPaidAmount > invoice.totalAmount) {
            throw new BadRequestException(
              `Updated payment amount would exceed invoice total (${invoice.totalAmount})`
            );
          }
  
          await this.invoiceService.updatePaymentStatus(invoice.id, newPaidAmount, user);
        }
      }
  
      await queryRunner.manager.update(Payment, id, updateData);
      await queryRunner.commitTransaction();
  
      this.logger.log(`Payment ${id} updated successfully`);
      return this.findOne(id, user);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to update payment ${id}: ${error.message}`);
      throw error instanceof BadRequestException ? error : new BadRequestException('Failed to update payment');
    } finally {
      await queryRunner.release();
    }
  }
  

  async refund(id: string, user: ActiveUserData, refundReason?: string): Promise<Payment> {
    const payment = await this.findOne(id, user);

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Only completed payments can be refunded');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.update(Payment, id, {
        status: PaymentStatus.REFUNDED,
        notes: refundReason ? `${payment.notes || ''}\nRefund Reason: ${refundReason}`.trim() : payment.notes,
      });

      if (payment.invoiceId) {
        const invoice = await this.invoiceRepository.findOne({
          where: { id: payment.invoiceId, tenantId: user.tenantId },
        });

        if (invoice) {
          const newPaidAmount = Math.max(0, Number(invoice.paidAmount) - Number(payment.amount));
          await this.invoiceService.updatePaymentStatus(invoice.id, newPaidAmount, user);
        }
      }

      await queryRunner.commitTransaction();

      this.logger.log(`Payment ${id} refunded successfully`);
      return this.findOne(id, user);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to refund payment ${id}: ${error.message}`);
      throw new BadRequestException('Failed to refund payment');
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string, user: ActiveUserData): Promise<boolean> {
    const payment = await this.findOne(id, user);

    if (payment.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Cannot delete a completed payment. Use refund instead.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.update(Payment, id, { isActive: false });
      await queryRunner.commitTransaction();

      this.logger.log(`Payment ${id} deleted successfully`);
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to delete payment ${id}: ${error.message}`);
      throw new BadRequestException('Failed to delete payment');
    } finally {
      await queryRunner.release();
    }
  }

  private async generateReferenceNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.paymentRepository.count({
      where: { tenantId },
    });

    return `PAY-${year}-${String(count + 1).padStart(8, '0')}`;
  }
}