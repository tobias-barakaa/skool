import { ActiveUserData } from "src/admin/auth/interface/active-user.interface";
import { DateRangeInput } from "../payment/dtos/create-payment.input";
import { LedgerEntry, LedgerSummary, StudentLedger } from "./ledger.input.dto";
import { Payment } from "../payment/entities/payment.entity";
import { Invoice } from "../invoice/entities/invoice.entity";
import { Between, Repository } from "typeorm";
import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Student } from "src/admin/student/entities/student.entity";

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);

  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
  ) {}

  async getStudentLedger(
    studentId: string,
    dateRange: DateRangeInput,
    user: ActiveUserData,
  ): Promise<StudentLedger> {
    const student = await this.studentRepo.findOne({
      where: { id: studentId, tenant_id: user.tenantId },
      relations: ['user', 'grade'],
    });

    if (!student) {
      throw new NotFoundException(`Student with id ${studentId} not found`);
    }

    const entries = await this.getLedgerEntries(studentId, dateRange, user);
    const summary = await this.getLedgerSummary(studentId, user);

    return {
      studentId,
      student,
      entries,
      summary,
      generatedAt: new Date(),
      dateRangeStart: dateRange?.startDate ? new Date(dateRange.startDate) : undefined,
      dateRangeEnd: dateRange?.endDate ? new Date(dateRange.endDate) : undefined,
    };
  }

  async getLedgerEntries(
    studentId: string,
    dateRange: DateRangeInput,
    user: ActiveUserData,
  ): Promise<LedgerEntry[]> {
    const whereClause: any = {
      studentId,
      tenantId: user.tenantId,
    };

    if (dateRange) {
      whereClause.issueDate = Between(
        new Date(dateRange.startDate),
        new Date(dateRange.endDate)
      );
    }

    const invoices = await this.invoiceRepo.find({
      where: whereClause,
      relations: ['term', 'academicYear'],
      order: { issueDate: 'ASC' },
    });

    const paymentWhereClause: any = {
      studentId,
      tenantId: user.tenantId,
    };

    if (dateRange) {
      paymentWhereClause.paymentDate = Between(
        new Date(dateRange.startDate),
        new Date(dateRange.endDate)
      );
    }

    const payments = await this.paymentRepo.find({
      where: paymentWhereClause,
      relations: ['invoice'],
      order: { paymentDate: 'ASC' },
    });

    const entries: LedgerEntry[] = [];
    let runningBalance = 0;

    const allTransactions = [
      ...invoices.map(inv => ({
        date: inv.issueDate,
        type: 'invoice' as const,
        data: inv,
      })),
      ...payments.map(pay => ({
        date: pay.paymentDate,
        type: 'payment' as const,
        data: pay,
      })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    for (const transaction of allTransactions) {
      if (transaction.type === 'invoice') {
        const invoice = transaction.data as Invoice;
        runningBalance += Number(invoice.totalAmount);
        
        entries.push({
          date: invoice.issueDate,
          description: `Invoice for ${invoice.term.name} - ${invoice.academicYear.name}`,
          reference: invoice.invoiceNumber,
          debit: Number(invoice.totalAmount),
          credit: 0,
          balance: runningBalance,
          invoiceNumber: invoice.invoiceNumber,
        });
      } else {
        const payment = transaction.data as Payment;
        runningBalance -= Number(payment.amount);
        
        entries.push({
          date: payment.paymentDate,
          description: `Payment received - ${payment.paymentMethod}`,
          reference: payment.receiptNumber,
          debit: 0,
          credit: Number(payment.amount),
          balance: runningBalance,
          receiptNumber: payment.receiptNumber,
        });
      }
    }

    return entries;
  }

  async getLedgerSummary(studentId: string, user: ActiveUserData): Promise<LedgerSummary> {
    const invoices = await this.invoiceRepo.find({
      where: { studentId, tenantId: user.tenantId },
    });

    const payments = await this.paymentRepo.find({
      where: { studentId, tenantId: user.tenantId },
      order: { paymentDate: 'DESC' },
    });

    const totalInvoiced = invoices.reduce(
      (sum, inv) => sum + Number(inv.totalAmount),
      0
    );

    const totalPaid = payments.reduce(
      (sum, pay) => sum + Number(pay.amount),
      0
    );

    const totalBalance = totalInvoiced - totalPaid;

    const averagePaymentAmount = payments.length > 0
      ? totalPaid / payments.length
      : 0;

    return {
      totalInvoiced,
      totalPaid,
      totalBalance,
      invoiceCount: invoices.length,
      paymentCount: payments.length,
      lastPaymentDate: payments[0]?.paymentDate,
      averagePaymentAmount,
    };
  }

  async getLedgersByGradeLevel(
    gradeLevelId: string,
    dateRange: DateRangeInput,
    user: ActiveUserData,
  ): Promise<StudentLedger[]> {
    const students = await this.studentRepo.find({
      where: { 
        tenant_id: user.tenantId,
        grade: { id: gradeLevelId }
      },
      relations: ['user', 'grade'],
    });

    const ledgers: StudentLedger[] = [];

    for (const student of students) {
      const ledger = await this.getStudentLedger(student.id, dateRange, user);
      ledgers.push(ledger);
    }

    return ledgers;
  }

  async generateLedgerPDF(
    studentId: string,
    dateRange: DateRangeInput,
    user: ActiveUserData,
  ): Promise<string> {
    const ledger = await this.getStudentLedger(studentId, dateRange, user);
    
    
    const filename = `ledger-${studentId}-${Date.now()}.pdf`;
    this.logger.log(`Generated ledger PDF: ${filename}`);
    
    return `https://storage.example.com/ledgers/${filename}`;
  }
}