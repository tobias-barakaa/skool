import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Invoice, InvoiceStatus } from './entities/invoice.entity';
import { Term } from 'src/admin/academic_years/entities/terms.entity';
import { TenantGradeLevel } from 'src/admin/school-type/entities/tenant-grade-level';
import { InvoiceItem } from './entities/invoice.entity.item';
import { Payment } from '../payment/entities/payment.entity';
import { Student } from 'src/admin/student/entities/student.entity';
import { StudentFeeAssignment } from '../fee-assignment/entities/student_fee_assignments.entity';
import { StudentFeeItem } from '../fee-assignment/entities/student_fee_items.entity';
import { CreateInvoiceInput } from './dtos/create-invoice.input';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { CreatePaymentInput } from './dtos/invoice.dto';


interface StudentFeeAssignmentWithHasInvoice extends StudentFeeAssignment {
  hasInvoice: boolean;
}
@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    @InjectRepository(Invoice)
    private invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private invoiceItemRepo: Repository<InvoiceItem>,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    // @InjectRepository(Term)
    // private termRepo: Repository<Term>,
    @InjectRepository(StudentFeeAssignment)
    private studentFeeAssignmentRepo: Repository<StudentFeeAssignment>,
    @InjectRepository(StudentFeeItem)
    private studentFeeItemRepo: Repository<StudentFeeItem>,
    private dataSource: DataSource,
  ) {}


  async generateInvoices(
    input: CreateInvoiceInput,
    user: ActiveUserData,
  ): Promise<Invoice[]> {
    const { studentId, termId, tenantGradeLevelIds, issueDate, dueDate, notes } = input;
    const tenantId = user.tenantId;
    const termRepo = this.dataSource.getRepository(Term);

    const term = await termRepo.findOne({
      where: { id: termId, tenantId },
      relations: ['academicYear'],
    });

    if (!term) {
      throw new NotFoundException(`Term with id ${termId} not found`);
    }

    const invoiceIssueDate = issueDate ? new Date(issueDate) : new Date();
    const invoiceDueDate = dueDate ? new Date(dueDate) : new Date(term.endDate);

    let students: Student[] = [];

    if (studentId) {
      const student = await this.studentRepo.findOne({
        where: { id: studentId, tenant_id: tenantId, isActive: true },
      });
      if (!student) {
        throw new NotFoundException(`Student with id ${studentId} not found`);
      }
      students = [student];
    } else if (tenantGradeLevelIds && tenantGradeLevelIds.length > 0) {
      students = await this.studentRepo.find({
        where: {
          tenant_id: tenantId,
          grade: In(tenantGradeLevelIds),
          isActive: true,
        },
      });
    } else {
      students = await this.studentRepo.find({
        where: {
          tenant_id: tenantId,
          isActive: true,
        },
      });
    }

    if (students.length === 0) {
      throw new BadRequestException('No students found for invoice generation');
    }

    this.logger.log(`Generating invoices for ${students.length} students`);

    const generatedInvoices: Invoice[] = [];

    for (const student of students) {
      const existingInvoice = await this.invoiceRepo.findOne({
        where: {
          tenantId,
          studentId: student.id,
          termId: term.id,
        },
      });

      if (existingInvoice) {
        this.logger.warn(`Invoice already exists for student ${student.id} and term ${term.id}`);
        continue;
      }

      const feeAssignments = await this.studentFeeAssignmentRepo.find({
        where: {
          tenantId,
          studentId: student.id,
        },
        relations: ['feeAssignment', 'feeAssignment.feeStructure', 'feeAssignment.feeStructure.terms'],
      });

      if (feeAssignments.length === 0) {
        this.logger.warn(`No fee assignments found for student ${student.id}`);
        continue;
      }

      const relevantAssignment = feeAssignments.find(assignment => 
        assignment.feeAssignment.feeStructure.terms.some(t => t.id === term.id)
      );

      if (!relevantAssignment) {
        this.logger.warn(`No fee assignment for term ${term.id} found for student ${student.id}`);
        continue;
      }

      const feeItems = await this.studentFeeItemRepo.find({
        where: {
          tenantId,
          studentFeeAssignmentId: relevantAssignment.id,
          isActive: true,
        },
        relations: ['feeStructureItem', 'feeStructureItem.feeBucket'],
      });

      if (feeItems.length === 0) {
        this.logger.warn(`No fee items found for student ${student.id}`);
        continue;
      }

      const invoiceNumber = await this.generateInvoiceNumber(tenantId);
      const totalAmount = feeItems.reduce((sum, item) => sum + Number(item.amount), 0);

      const invoice = this.invoiceRepo.create({
        tenantId,
        invoiceNumber,
        studentId: student.id,
        termId: term.id,
        academicYearId: term.academicYearId,
        issueDate: invoiceIssueDate,
        dueDate: invoiceDueDate,
        totalAmount,
        paidAmount: 0,
        balanceAmount: totalAmount,
        status: InvoiceStatus.PENDING,
        notes,
      });

      const savedInvoice = await this.invoiceRepo.save(invoice);

      const invoiceItems = feeItems.map(feeItem => {
        return this.invoiceItemRepo.create({
          tenantId,
          invoiceId: savedInvoice.id,
          feeBucketId: feeItem.feeStructureItem.feeBucketId,
          description: feeItem.feeStructureItem.feeBucket.name,
          amount: feeItem.amount,
          isMandatory: feeItem.isMandatory,
        });
      });

      await this.invoiceItemRepo.save(invoiceItems);

     
      const completeInvoice = await this.invoiceRepo.findOne({
        where: { id: savedInvoice.id },
        relations: ['student','student.user', 'term', 'academicYear', 'items', 'items.feeBucket'],
      });
      
      if (completeInvoice) {
        generatedInvoices.push(completeInvoice);
      }


      await this.studentFeeAssignmentRepo.update(
        { id: relevantAssignment.id },
        { hasInvoice: true }
      );

      this.logger.log(`Invoice ${invoiceNumber} generated for student ${student.id}`);
    }

    return generatedInvoices;
  }

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
      relations: ['invoice', 'student', 'receivedByUser'],
    });

    
  }

  async findByStudent(studentId: string, user: ActiveUserData): Promise<Invoice[]> {
    return await this.invoiceRepo.find({
      where: {
        studentId,
        tenantId: user.tenantId,
      },
      relations: ['student', 'term', 'academicYear', 'items', 'items.feeBucket', 'payments'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string, user: ActiveUserData): Promise<Invoice> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id, tenantId: user.tenantId },
      relations: ['student', 'term', 'academicYear', 'items', 'items.feeBucket', 'payments', 'payments.receivedByUser'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with id ${id} not found`);
    }

    return invoice;
  }

  async findAllByTenant(user: ActiveUserData): Promise<Invoice[]> {
    return await this.invoiceRepo.find({
      where: { tenantId: user.tenantId },
      relations: ['student', 'term', 'academicYear', 'items', 'payments'],
      order: { createdAt: 'DESC' },
    });
  }

  private async generateInvoiceNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    
    const lastInvoice = await this.invoiceRepo
      .createQueryBuilder('invoice')
      .where('invoice.tenantId = :tenantId', { tenantId })
      .andWhere('invoice.invoiceNumber LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('invoice.createdAt', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (lastInvoice) {
      const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-').pop() || '0');
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(6, '0')}`;
  }

  private async generateReceiptNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `RCT-${year}-`;
    
    const lastPayment = await this.paymentRepo
      .createQueryBuilder('payment')
      .where('payment.tenantId = :tenantId', { tenantId })
      .andWhere('payment.receiptNumber LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('payment.createdAt', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (lastPayment) {
      const lastNumber = parseInt(lastPayment.receiptNumber.split('-').pop() || '0');
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(6, '0')}`;
  }
}

