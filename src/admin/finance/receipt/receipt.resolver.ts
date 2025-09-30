import { Args, ID, Mutation, Query, Resolver } from "@nestjs/graphql";
import { Logger } from "@nestjs/common";
import { Receipt } from "./receipt.entity";
import { ReceiptService } from "./receipt.service";
import { ActiveUserData } from "src/admin/auth/interface/active-user.interface";
import { ActiveUser } from "src/admin/auth/decorator/active-user.decorator";


@Resolver(() => Receipt)
export class ReceiptResolver {
  private readonly logger = new Logger(ReceiptResolver.name);

  constructor(private readonly receiptService: ReceiptService) {}

  @Query(() => Receipt, {
    description: 'Get receipt by payment ID'
  })
  async receiptByPayment(
    @Args('paymentId', { type: () => ID }) paymentId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<Receipt> {
    this.logger.log(`Fetching receipt for payment ${paymentId}`);
    return await this.receiptService.generateReceipt(paymentId, user);
  }

  @Query(() => Receipt, {
    description: 'Get receipt by receipt number'
  })
  async receiptByNumber(
    @Args('receiptNumber') receiptNumber: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<Receipt> {
    this.logger.log(`Fetching receipt ${receiptNumber}`);
    return await this.receiptService.findByReceiptNumber(receiptNumber, user);
  }

  @Query(() => [Receipt], {
    description: 'Get all receipts for a student'
  })
  async receiptsByStudent(
    @Args('studentId', { type: () => ID }) studentId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<Receipt[]> {
    this.logger.log(`Fetching receipts for student ${studentId}`);
    return await this.receiptService.findByStudent(studentId, user);
  }

  @Mutation(() => String, {
    description: 'Generate PDF receipt for a payment'
  })
  async generateReceiptPDF(
    @Args('paymentId', { type: () => ID }) paymentId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<string> {
    this.logger.log(`Generating PDF receipt for payment ${paymentId}`);
    return await this.receiptService.generatePDF(paymentId, user);
  }

  @Mutation(() => Boolean, {
    description: 'Email receipt to student/parent'
  })
  async emailReceipt(
    @Args('paymentId', { type: () => ID }) paymentId: string,
    @Args('emailAddress') emailAddress: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<boolean> {
    this.logger.log(`Emailing receipt for payment ${paymentId} to ${emailAddress}`);
    return await this.receiptService.emailReceipt(paymentId, emailAddress, user);
  }
}