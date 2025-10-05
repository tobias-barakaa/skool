
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DataSource } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { Invoice, InvoiceStatus } from '../invoice/entities/invoice.entity';
import { CreatePaymentInput, PaymentFilters, UpdatePaymentInput } from './dtos/create-payment.input';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    private readonly dataSource: DataSource,
  ) {}




  async createPayment(
      input: CreatePaymentInput,
      user: ActiveUserData,
    ): Promise<Payment> {
      const { invoiceId, amount, paymentMethod, transactionReference, paymentDate, notes } = input;
      const tenantId = user.tenantId;
  
      const invoice = await this.invoiceRepo.findOne({
        where: { id: invoiceId, tenantId },
        relations: ['student'],
      });
  
      if (!invoice) {
        throw new NotFoundException(`Invoice with id ${invoiceId} not found`);
      }
  
      if (amount > invoice.balanceAmount) {
        throw new BadRequestException(
          `Payment amount (${amount}) exceeds balance amount (${invoice.balanceAmount})`,
        );
      }
  
      const receiptNumber = await this.generateReceiptNumber(tenantId);
  
      const payment = this.paymentRepo.create({
        tenantId,
        receiptNumber,
        invoiceId: invoice.id,
        studentId: invoice.studentId,
        amount,
        paymentMethod,
        transactionReference,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        receivedBy: user.sub,
        notes,
      });
  
      const savedPayment = await this.paymentRepo.save(payment);
  
      // Update invoice
      const newPaidAmount = Number(invoice.paidAmount) + Number(amount);
      const newBalanceAmount = Number(invoice.totalAmount) - newPaidAmount;
  
      let newStatus = invoice.status;
      if (newBalanceAmount === 0) {
        newStatus = InvoiceStatus.PAID;
      } else if (newPaidAmount > 0 && newBalanceAmount > 0) {
        newStatus = InvoiceStatus.PARTIALLY_PAID;
      }
  
      await this.invoiceRepo.update(invoice.id, {
        paidAmount: newPaidAmount,
        balanceAmount: newBalanceAmount,
        status: newStatus,
      });
  
      
      await this.allocatePaymentToFeeItems(invoice.studentId, tenantId, amount);
  
      
      await this.updateStudentTotalFeesPaid(invoice.studentId);
  
      this.logger.log(
        `Payment ${receiptNumber} of ${amount} recorded for invoice ${invoice.invoiceNumber}`,
      );
  
      return this.paymentRepo.findOneOrFail({
        where: { id: savedPayment.id },
        relations: ['invoice', 'student', 'student.user', 'receivedByUser'],
      });
    }


    private async updateStudentTotalFeesPaid(studentId: string): Promise<void> {
      const result = await this.dataSource.query(
        `
        SELECT COALESCE(SUM(sfi."amountPaid"), 0) as total_paid
        FROM student_fee_items sfi
        JOIN student_fee_assignments sfa ON sfi."studentFeeAssignmentId" = sfa.id
        WHERE sfa."studentId" = $1 AND sfi."isActive" = true
      `,
        [studentId],
      );
  
      const totalPaid = parseFloat(result[0]?.total_paid || 0);
  const studentRepository = this.dataSource.getRepository('Student');
      await studentRepository.update(
        { id: studentId },
        { totalFeesPaid: totalPaid },
      );
    }
  // async createPayment(input: CreatePaymentInput, user: ActiveUserData): Promise<Payment> {
  //   const { invoiceId, amount, paymentMethod, transactionReference, paymentDate, notes } = input;
  //   const tenantId = user.tenantId;

  //   const invoice = await this.invoiceRepo.findOne({
  //     where: { id: invoiceId, tenantId },
  //     relations: ['student'],
  //   });

  //   if (!invoice) {
  //     throw new NotFoundException(`Invoice with id ${invoiceId} not found`);
  //   }

  //   if (amount > invoice.balanceAmount) {
  //     throw new BadRequestException(
  //       `Payment amount (${amount}) exceeds balance amount (${invoice.balanceAmount})`
  //     );
  //   }

  //   const receiptNumber = await this.generateReceiptNumber(tenantId);

  //   const payment = this.paymentRepo.create({
  //     tenantId,
  //     receiptNumber,
  //     invoiceId: invoice.id,
  //     studentId: invoice.studentId,
  //     amount,
  //     paymentMethod,
  //     transactionReference,
  //     paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
  //     receivedBy: user.sub,
  //     notes,
  //   });

  //   const savedPayment = await this.paymentRepo.save(payment);

  //   const newPaidAmount = Number(invoice.paidAmount) + Number(amount);
  //   const newBalanceAmount = Number(invoice.totalAmount) - newPaidAmount;

  //   let newStatus = invoice.status;
  //   if (newBalanceAmount === 0) {
  //     newStatus = InvoiceStatus.PAID;
  //   } else if (newPaidAmount > 0 && newBalanceAmount > 0) {
  //     newStatus = InvoiceStatus.PARTIALLY_PAID;
  //   }

  //   await this.invoiceRepo.update(invoice.id, {
  //     paidAmount: newPaidAmount,
  //     balanceAmount: newBalanceAmount,
  //     status: newStatus,
  //   });
  //   await this.allocatePaymentToFeeItems(invoice.studentId, tenantId, amount);


  //   this.logger.log(`Payment ${receiptNumber} of ${amount} recorded for invoice ${invoice.invoiceNumber}`);

  //   return this.paymentRepo.findOneOrFail({
  //     where: { id: savedPayment.id },
  //     relations: ['invoice', 'student','student.user', 'receivedByUser'],
  //   });
  // }



  async allocatePaymentToFeeItems(
    studentId: string,
    tenantId: string,
    paymentAmount: number,
    ruleOrder: string[] = ['TUITION', 'LUNCH', 'BUS', 'TRANSPORT'],
  ): Promise<{ [feeItemId: string]: number }> {
    const studentFeeItemRepository = this.paymentRepo.manager.getRepository('StudentFeeItem');
    const feeItems = await studentFeeItemRepository
      .createQueryBuilder('sfi')
      .innerJoinAndSelect('sfi.studentFeeAssignment', 'sfa')
      .innerJoinAndSelect('sfi.feeStructureItem', 'fsi')
      .innerJoinAndSelect('fsi.feeBucket', 'fb')
      .where('sfa.studentId = :studentId', { studentId })
      .andWhere('sfi.tenantId = :tenantId', { tenantId })
      .andWhere('sfi.isActive = true')
      .orderBy('fb.name', 'ASC')
      .getMany();

    let remaining = paymentAmount;
    const allocations: Record<string, number> = {};

    for (const bucket of ruleOrder) {
      if (remaining <= 0) break;

      const itemsInBucket = feeItems.filter(
        (fi) => fi.feeStructureItem.feeBucket.name.toUpperCase() === bucket,
      );

      for (const item of itemsInBucket) {
        if (remaining <= 0) break;
        const unpaid = Number(item.amount) - Number(item.amountPaid || 0);
        if (unpaid <= 0) continue;

        const toPay = Math.min(unpaid, remaining);
        allocations[item.id] = toPay;
        item.amountPaid = Number(item.amountPaid || 0) + toPay;
        remaining -= toPay;

        await studentFeeItemRepository.save(item);
      }
    }

    if (remaining > 0) {
      for (const item of feeItems) {
        if (remaining <= 0) break;
        const unpaid = Number(item.amount) - Number(item.amountPaid || 0);
        if (unpaid <= 0) continue;

        const toPay = Math.min(unpaid, remaining);
        allocations[item.id] = (allocations[item.id] || 0) + toPay;
        item.amountPaid = Number(item.amountPaid || 0) + toPay;
        remaining -= toPay;

        await studentFeeItemRepository.save(item);
      }
    }

    return allocations;
  }



  async deallocatePaymentFromFeeItems(
    studentId: string,
    tenantId: string,
    amount: number,
  ): Promise<void> {
    const studentFeeItemRepository = this.paymentRepo.manager.getRepository('StudentFeeItem');

    const feeItems = await studentFeeItemRepository
      .createQueryBuilder('sfi')
      .innerJoinAndSelect('sfi.studentFeeAssignment', 'sfa')
      .innerJoinAndSelect('sfi.feeStructureItem', 'fsi')
      .innerJoinAndSelect('fsi.feeBucket', 'fb')
      .where('sfa.studentId = :studentId', { studentId })
      .andWhere('sfi.tenantId = :tenantId', { tenantId })
      .andWhere('sfi.isActive = true')
      .andWhere('sfi.amountPaid > 0')
      .orderBy('fb.name', 'DESC')
      .getMany();

    let remaining = amount;

    for (const item of feeItems) {
      if (remaining <= 0) break;
      const paid = Number(item.amountPaid || 0);
      const toDeduct = Math.min(paid, remaining);

      item.amountPaid = paid - toDeduct;
      remaining -= toDeduct;

      await studentFeeItemRepository.save(item);
    }
  }
  

  async updatePayment(id: string, input: UpdatePaymentInput, user: ActiveUserData): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({
      where: { id, tenantId: user.tenantId },
      relations: ['invoice'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with id ${id} not found`);
    }

    if (input.amount && input.amount !== payment.amount) {
      const invoice = payment.invoice;
      const amountDifference = Number(input.amount) - Number(payment.amount);
      
      const newPaidAmount = Number(invoice.paidAmount) + amountDifference;
      const newBalanceAmount = Number(invoice.totalAmount) - newPaidAmount;

      if (newBalanceAmount < 0) {
        throw new BadRequestException('Updated payment amount exceeds invoice total');
      }

      let newStatus = invoice.status;
      if (newBalanceAmount === 0) {
        newStatus = InvoiceStatus.PAID;
      } else if (newPaidAmount > 0 && newBalanceAmount > 0) {
        newStatus = InvoiceStatus.PARTIALLY_PAID;
      } else {
        newStatus = InvoiceStatus.PENDING;
      }

      await this.invoiceRepo.update(invoice.id, {
        paidAmount: newPaidAmount,
        balanceAmount: newBalanceAmount,
        status: newStatus,
      });
    }

    Object.assign(payment, input);
    await this.paymentRepo.save(payment);

    this.logger.log(`Payment ${payment.receiptNumber} updated by user ${user.sub}`);

    return this.paymentRepo.findOneOrFail({
      where: { id },
      relations: ['invoice', 'student', 'receivedByUser'],
    });
  }

  async voidPayment(id: string, reason: string, user: ActiveUserData): Promise<boolean> {
    const payment = await this.paymentRepo.findOne({
      where: { id, tenantId: user.tenantId },
      relations: ['invoice'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with id ${id} not found`);
    }

    const invoice = payment.invoice;
    const newPaidAmount = Number(invoice.paidAmount) - Number(payment.amount);
    const newBalanceAmount = Number(invoice.totalAmount) - newPaidAmount;

    let newStatus = invoice.status;
    if (newBalanceAmount === invoice.totalAmount) {
      newStatus = InvoiceStatus.PENDING;
    } else if (newPaidAmount > 0 && newBalanceAmount > 0) {
      newStatus = InvoiceStatus.PARTIALLY_PAID;
    }

    await this.invoiceRepo.update(invoice.id, {
      paidAmount: newPaidAmount,
      balanceAmount: newBalanceAmount,
      status: newStatus,
    });

    payment.notes = `VOIDED: ${reason}. Original notes: ${payment.notes || 'N/A'}`;
    payment.isVoided = true;
    payment.voidedAt = new Date();
    payment.voidedBy = user.sub;
    await this.paymentRepo.save(payment);

    this.logger.log(`Payment ${payment.receiptNumber} voided by user ${user.sub}`);
    return true;
  }


  async deletePayment(id: string, user: ActiveUserData): Promise<boolean> {
    const payment = await this.paymentRepo.findOne({
      where: { id, tenantId: user.tenantId },
      relations: ['invoice'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with id ${id} not found`);
    }

    const invoice = payment.invoice;
    const newPaidAmount = Number(invoice.paidAmount) - Number(payment.amount);
    const newBalanceAmount = Number(invoice.totalAmount) - newPaidAmount;

    let newStatus = invoice.status;
    if (newBalanceAmount === invoice.totalAmount) {
      newStatus = InvoiceStatus.PENDING;
    } else if (newPaidAmount > 0) {
      newStatus = InvoiceStatus.PARTIALLY_PAID;
    }

    await this.invoiceRepo.update(invoice.id, {
      paidAmount: newPaidAmount,
      balanceAmount: newBalanceAmount,
      status: newStatus,
    });

    await this.paymentRepo.delete(id);

    this.logger.log(`Payment ${payment.receiptNumber} permanently deleted by user ${user.sub}`);
    return true;
  }

  async findById(id: string, user: ActiveUserData): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({
      where: { id, tenantId: user.tenantId },
      relations: ['invoice', 'student', 'student.user', 'receivedByUser'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with id ${id} not found`);
    }

    return payment;
  }

  async findAll(filters: PaymentFilters, user: ActiveUserData): Promise<Payment[]> {
    const where: any = { tenantId: user.tenantId };

    if (filters) {
      if (filters.studentId) where.studentId = filters.studentId;
      if (filters.invoiceId) where.invoiceId = filters.invoiceId;
      if (filters.paymentMethod) where.paymentMethod = filters.paymentMethod;
      if (filters.receiptNumber) where.receiptNumber = filters.receiptNumber;
      
      if (filters.startDate && filters.endDate) {
        where.paymentDate = Between(new Date(filters.startDate), new Date(filters.endDate));
      }
    }

    return this.paymentRepo.find({
      where,
      relations: ['invoice', 'student','student.user', 'receivedByUser'],
      order: { paymentDate: 'DESC' },
    });
  }

  

  async findByStudent(studentId: string, user: ActiveUserData): Promise<Payment[]> {
    return this.paymentRepo.find({
      where: { studentId, tenantId: user.tenantId },
      relations: ['invoice','invoice.term', 'receivedByUser'],
      order: { paymentDate: 'DESC' },
    });
  }

  async findByInvoice(invoiceId: string, user: ActiveUserData): Promise<Payment[]> {
    return this.paymentRepo.find({
      where: { invoiceId, tenantId: user.tenantId },
      relations: ['student', 'receivedByUser'],
      order: { paymentDate: 'ASC' },
    });
  }

  private async generateReceiptNumber(tenantId: string): Promise<string> {
    const lastPayment = await this.paymentRepo.findOne({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });

    const lastNumber = lastPayment?.receiptNumber?.match(/\d+$/)?.[0] || '0';
    const nextNumber = (parseInt(lastNumber) + 1).toString().padStart(6, '0');
    const year = new Date().getFullYear();

    return `RCP-${year}-${nextNumber}`;
  }
}

