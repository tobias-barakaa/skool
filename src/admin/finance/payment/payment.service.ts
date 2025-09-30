
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
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
  ) {}

  async createPayment(input: CreatePaymentInput, user: ActiveUserData): Promise<Payment> {
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
        `Payment amount (${amount}) exceeds balance amount (${invoice.balanceAmount})`
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

    this.logger.log(`Payment ${receiptNumber} of ${amount} recorded for invoice ${invoice.invoiceNumber}`);

    return this.paymentRepo.findOneOrFail({
      where: { id: savedPayment.id },
      relations: ['invoice', 'student','student.user', 'receivedByUser'],
    });
  }

  async updatePayment(id: string, input: UpdatePaymentInput, user: ActiveUserData): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({
      where: { id, tenantId: user.tenantId },
      relations: ['invoice'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with id ${id} not found`);
    }

    // If amount is being changed, recalculate invoice
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


// ==================== ENTITIES ====================

// invoice.entity.ts


// invoice-item.entity.ts

// payment.entity.ts

// ==================== DTOs ====================

// create-invoice.input.ts


// create-payment.input.ts


// ==================== SERVICE ====================

// invoice.service.ts

// ==================== RESOLVER ====================

// invoice.resolver.ts


// ==================== MODULE ====================

// // invoice.module.ts
// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { InvoiceService } from './invoice.service';
// import { InvoiceResolver } from './invoice.resolver';
// import { Invoice } from './entities/invoice.entity';
// import { InvoiceItem } from './entities/invoice-item.entity';
// import { Payment } from './entities/payment.entity';
// import { Student } from 'src/admin/students/entities/student.entity';
// import { Term } from 'src/admin/academic_years/entities/terms.entity';
// import { StudentFeeAssignment } from 'src/admin/fee-assignment/entities/student_fee_assignments.entity';
// import { StudentFeeItem } from 'src/admin/fee-assignment/entities/student_fee_items.entity';

// @Module({
//   imports: [
//     TypeOrmModule.forFeature([
//       Invoice,
//       InvoiceItem,
//       Payment,
//       Student,
//       Term,
//       StudentFeeAssignment,
//       StudentFeeItem,
//     ]),
//   ],
//   providers: [InvoiceResolver, InvoiceService],
//   exports: [InvoiceService],
// })
// export class InvoiceModule {}

// ==================== USAGE EXAMPLES ====================

/*
# Generate invoices for a single student
mutation {
  generateInvoices(input: {
    studentId: "student-uuid-here"
    termId: "1d6ad218-8c82-4a98-b6d7-10a7c323cf21"
    issueDate: "2024-09-01"
    dueDate: "2024-12-15"
    notes: "Term 1 fees"
  }) {
    id
    invoiceNumber
    student { id name }
    term { id name }
    totalAmount
    balanceAmount
    status
    items {
      id
      feeBucket { name }
      amount
    }
  }
}

# Generate invoices for specific grade levels
mutation {
  generateInvoices(input: {
    termId: "1d6ad218-8c82-4a98-b6d7-10a7c323cf21"
    tenantGradeLevelIds: ["e6089d87-047a-47ef-b917-6d5eec607516"]
    issueDate: "2024-09-01"
    dueDate: "2024-12-15"
  }) {
    id
    invoiceNumber
    student { id name }
    totalAmount
    status
  }
}

# Generate invoices for ALL students in the tenant
mutation {
  generateInvoices(input: {
    termId: "1d6ad218-8c82-4a98-b6d7-10a7c323cf21"
  }) {
    id
    invoiceNumber
    student { id name }
    totalAmount
  }
}

# Record a payment
mutation {
  createPayment(input: {
    invoiceId: "invoice-uuid-here"
    amount: 5000.00
    paymentMethod: MPESA
    transactionReference: "QXR123456"
    paymentDate: "2024-09-15"
    notes: "First installment"
  }) {
    id
    receiptNumber
    amount
    paymentMethod
    invoice {
      invoiceNumber
      balanceAmount
      status
    }
  }
}



# Get invoices for a student
query {
  invoicesByStudent(studentId: "student-uuid-here") {
    id
    invoiceNumber
    term { name }
    totalAmount
    paidAmount
    balanceAmount
    status
    items {
      feeBucket { name }
      amount
    }
    payments {
      receiptNumber
      amount
      paymentDate
    }
  }
}

# Get single invoice
query {
  invoice(id: "invoice-uuid-here") {
    id
    invoiceNumber
    student { name }
    term { name }
    academicYear { name }
    totalAmount
    paidAmount
    balanceAmount
    status
    items {
      feeBucket { name }
      amount
    }
    payments {
      receiptNumber
      amount
      paymentMethod
      paymentDate
      receivedByUser { name }
    }
  }
}

# Get all invoices for tenant
query {
  invoices {
    id
    invoiceNumber
    student { name }
    term { name }
    totalAmount
    balanceAmount
    status
    issueDate
    dueDate
  }
}
*/

// ==================== ADDITIONAL UPDATES NEEDED ====================

/*
UPDATE student_fee_assignments table to add hasInvoice column:
ALTER TABLE student_fee_assignments ADD COLUMN has_invoice BOOLEAN DEFAULT FALSE;

UPDATE StudentFeeAssignment entity to include:
*/

// student_fee_assignments.entity.ts - ADD THIS FIELD


// @Field({ description: 'Indicates if invoice has been generated for this assignment' })
// @Column({ default: false })
// hasInvoice: boolean;