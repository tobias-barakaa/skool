import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Receipt, ReceiptType } from "./receipt.entity";
import { Payment, PaymentMethod } from "../payment/entities/payment.entity";
import { Between, Repository } from "typeorm";
import { Student } from "src/admin/student/entities/student.entity";
import { Invoice } from "../invoice/entities/invoice.entity";
import { ActiveUserData } from "src/admin/auth/interface/active-user.interface";
import { DateRangeInput } from "../payment/dtos/create-payment.input";
import { EmailService } from "src/admin/email/providers/email.service";

@Injectable()
export class ReceiptService {
  private readonly logger = new Logger(ReceiptService.name);

  constructor(
    @InjectRepository(Receipt)
    private readonly receiptRepo: Repository<Receipt>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    // private readonly pdfService: PDFService, // Assume a PDF generation service
    // private readonly storageService: StorageService, // Assume a file storage service
    private readonly emailService: EmailService, // Assume an email service
  ) {}

  
  async generateReceipt(paymentId: string, user: ActiveUserData): Promise<Receipt> {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId, tenantId: user.tenantId },
      relations: ['invoice', 'student', 'receivedByUser', 'invoice.term', 'invoice.academicYear'],
    });

    console.log(payment, 'this is payment iddeess')

    if (!payment) {
      throw new NotFoundException(`Payment with id ${paymentId} not found`);
    }

    let receipt = await this.receiptRepo.findOne({
      where: { paymentId, tenantId: user.tenantId },
      relations: ['payment', 'student', 'student.user'],
    });

    console.log(receipt, 'this is receipt iddeess')

    if (!receipt) {
      receipt = this.receiptRepo.create({
        tenantId: user.tenantId,
        receiptNumber: payment.receiptNumber,
        paymentId: payment.id,
        studentId: payment.studentId,
        type: ReceiptType.PAYMENT,
        amount: payment.amount,
        receiptDate: payment.paymentDate,
      });
      
      receipt = await this.receiptRepo.save(receipt);
      this.logger.log(`Receipt ${receipt.receiptNumber} generated for payment ${paymentId}`);
    }

    // return this.receiptRepo.findOneOrFail({
    //   where: { id: receipt.id },
    //   relations: ['payment', 'student', 'student.user', 'payment.invoice', 'payment.receivedByUser'],
    // });

    return this.receiptRepo.findOneOrFail({
      where: { id: receipt.id },
      relations: [
        'payment',
        'payment.invoice',
        'payment.invoice.term',       
        'payment.invoice.academicYear',
        'student',
        'student.user',
        'payment.receivedByUser',
      ],
    });
  }

  async findByReceiptNumber(receiptNumber: string, user: ActiveUserData): Promise<Receipt> {
    const receipt = await this.receiptRepo.findOne({
      where: { receiptNumber, tenantId: user.tenantId },
      relations: [
        'payment', 
        'student', 
        'student.user', 
        'student.grade',
        'payment.invoice',
        'payment.invoice.term',
        'payment.invoice.academicYear',
        'payment.receivedByUser'
      ],
    });

    if (!receipt) {
      throw new NotFoundException(`Receipt ${receiptNumber} not found`);
    }

    return receipt;
  }

  async findByStudent(studentId: string, user: ActiveUserData): Promise<Receipt[]> {
    const receipts = await this.receiptRepo.find({
      where: { studentId, tenantId: user.tenantId },
      relations: [
        'payment', 
        'payment.invoice',
        'payment.invoice.term',
        'payment.receivedByUser'
      ],
      order: { receiptDate: 'DESC' },
    });

    return receipts;
  }

  async findByDateRange(
    startDate: string,
    endDate: string,
    user: ActiveUserData,
  ): Promise<Receipt[]> {
    return this.receiptRepo.find({
      where: {
        tenantId: user.tenantId,
        receiptDate: Between(new Date(startDate), new Date(endDate)),
      },
      relations: ['payment', 'student', 'student.user'],
      order: { receiptDate: 'DESC' },
    });
  }

  
  async findByPaymentMethod(
    paymentMethod: PaymentMethod,
    user: ActiveUserData,
  ): Promise<Receipt[]> {
    return this.receiptRepo
      .createQueryBuilder('receipt')
      .leftJoinAndSelect('receipt.payment', 'payment')
      .leftJoinAndSelect('receipt.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .where('receipt.tenantId = :tenantId', { tenantId: user.tenantId })
      .andWhere('payment.paymentMethod = :paymentMethod', { paymentMethod })
      .orderBy('receipt.receiptDate', 'DESC')
      .getMany();
  }

  async generatePDF(paymentId: string, user: ActiveUserData): Promise<string> {
    const receipt = await this.generateReceipt(paymentId, user);
    
    const payment = receipt.payment;
    const student = receipt.student;
    const invoice = payment.invoice;

    const receiptData = {
      receiptNumber: receipt.receiptNumber,
      receiptDate: receipt.receiptDate,
      studentInfo: {
        name: student.user.name,
        admissionNumber: student.admission_number,
        grade: student.grade?.shortName,
        email: student.user.email,
        phone: student.phone,
      },
      paymentInfo: {
        amount: receipt.amount,
        paymentMethod: payment.paymentMethod,
        transactionReference: payment.transactionReference,
        paymentDate: payment.paymentDate,
      },
      invoiceInfo: {
        invoiceNumber: invoice.invoiceNumber,
        term: invoice.term.name,
        academicYear: invoice.academicYear.name,
        totalAmount: invoice.totalAmount,
        paidAmount: invoice.paidAmount,
        balanceAmount: invoice.balanceAmount,
      },
      receivedBy: payment.receivedByUser?.name,
    };

    // Here you would integrate with PDF generation library
    // Example using puppeteer or pdfmake
    /*
    const pdfBuffer = await this.generateReceiptPDFBuffer(receiptData);
    const filename = `receipt-${receipt.receiptNumber}.pdf`;
    const pdfUrl = await this.uploadToStorage(pdfBuffer, filename);
    
    // Update receipt with PDF URL
    await this.receiptRepo.update(receipt.id, { pdfUrl });
    
    return pdfUrl;
    */

    // Mock implementation
    const pdfUrl = `https://storage.example.com/receipts/${receipt.receiptNumber}.pdf`;
    await this.receiptRepo.update(receipt.id, { pdfUrl });
    
    this.logger.log(`PDF generated for receipt ${receipt.receiptNumber}`);
    return pdfUrl;
  }

  
  async emailReceipt(
    paymentId: string,
    emailAddress: string,
    user: ActiveUserData,
  ): Promise<boolean> {
    const receipt = await this.generateReceipt(paymentId, user);
  
    let pdfUrl = receipt.pdfUrl;
    if (!pdfUrl) {
      pdfUrl = await this.generatePDF(paymentId, user);
    }
  
    const payment = receipt.payment;
    const student = receipt.student;
  
    await this.emailService.sendReceiptEmail(emailAddress, {
      recipientName: student.user.name,
      schoolName: user.tenantId['schoolName'],
      receiptNumber: receipt.receiptNumber,
      amount: receipt.amount,
      paymentMethod: payment.paymentMethod ?? 'Unknown',
      paymentDate: payment.paymentDate?.toISOString() ?? '',
      invoiceNumber: payment.invoice.invoiceNumber,
      balanceAmount: payment.invoice.balanceAmount,
      pdfUrl,
    });
  
    return true;
  }
  

  async voidReceipt(paymentId: string, user: ActiveUserData): Promise<boolean> {
    const receipt = await this.receiptRepo.findOne({
      where: { paymentId, tenantId: user.tenantId },
    });

    if (!receipt) {
      throw new NotFoundException(`Receipt for payment ${paymentId} not found`);
    }

    receipt.type = ReceiptType.ADJUSTMENT;
    await this.receiptRepo.save(receipt);

    this.logger.log(`Receipt ${receipt.receiptNumber} voided`);
    return true;
  }

  /**
   * Get receipt statistics for reporting
   */
  // async getReceiptStatistics(
  //   dateRange: DateRangeInput,
  //   user: ActiveUserData,
  // ): Promise<{
  //   totalReceipts: number;
  //   totalAmount: number;
  //   byPaymentMethod: Record<PaymentMethod, { count: number; amount: number }>;
  // }> {
  //   const receipts = await this.findByDateRange(
  //     dateRange.startDate,
  //     dateRange.endDate,
  //     user,
  //   );

  //   const stats = {
  //     totalReceipts: receipts.length,
  //     totalAmount: receipts.reduce((sum, r) => sum + Number(r.amount), 0),
  //     byPaymentMethod: {} as Record<PaymentMethod, { count: number; amount: number }>,
  //   };

  //   // Group by payment method
  //   receipts.forEach((receipt) => {
  //     const method = receipt.payment.paymentMethod;
  //     if (!stats.byPaymentMethod[method]) {
  //       stats.byPaymentMethod[method] = { count: 0, amount: 0 };
  //     }
  //     // stats.byPaymentMethod[method].count++;
  //     // stats.byPaymentMethod[method].amount += Number(receipt.amount);
  //   });

  //   return stats;
  // }

  /**
   * Bulk generate receipts for multiple payments
   */
  async bulkGenerateReceipts(
    paymentIds: string[],
    user: ActiveUserData,
  ): Promise<Receipt[]> {
    const receipts: Receipt[] = [];

    for (const paymentId of paymentIds) {
      try {
        const receipt = await this.generateReceipt(paymentId, user);
        receipts.push(receipt);
      } catch (error) {
        this.logger.error(`Failed to generate receipt for payment ${paymentId}:`, error);
      }
    }

    this.logger.log(`Bulk generated ${receipts.length} receipts`);
    return receipts;
  }

  /**
   * Private helper: Generate PDF buffer (to be implemented with actual PDF library)
   */
  private async generateReceiptPDFBuffer(receiptData: any): Promise<Buffer> {
    // This would use a library like pdfmake or puppeteer
    // Example structure:
    /*
    const pdfMake = require('pdfmake');
    
    const docDefinition = {
      content: [
        { text: 'PAYMENT RECEIPT', style: 'header' },
        { text: `Receipt No: ${receiptData.receiptNumber}` },
        { text: `Date: ${receiptData.receiptDate}` },
        // ... more content
      ],
      styles: {
        header: { fontSize: 18, bold: true }
      }
    };
    
    return new Promise((resolve) => {
      const pdfDoc = pdfMake.createPdf(docDefinition);
      pdfDoc.getBuffer((buffer) => resolve(buffer));
    });
    */
    
    // Mock implementation
    return Buffer.from('PDF content here');
  }

  /**
   * Private helper: Upload to storage (to be implemented with actual storage service)
   */
  private async uploadToStorage(buffer: Buffer, filename: string): Promise<string> {
    // This would integrate with S3, Google Cloud Storage, etc.
    /*
    const s3 = new AWS.S3();
    const result = await s3.upload({
      Bucket: 'your-bucket',
      Key: `receipts/${filename}`,
      Body: buffer,
      ContentType: 'application/pdf',
    }).promise();
    
    return result.Location;
    */
    
    // Mock implementation
    return `https://storage.example.com/receipts/${filename}`;
  }
}
