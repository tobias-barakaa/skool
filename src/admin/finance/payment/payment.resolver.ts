
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { Logger, UseGuards } from '@nestjs/common';
import { Payment } from './entities/payment.entity';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { PaymentService } from './payment.service';
import { CreatePaymentInput, PaymentFilters, UpdatePaymentInput } from './dtos/create-payment.input';

@Resolver(() => Payment)
export class PaymentResolver {
  private readonly logger = new Logger(PaymentResolver.name);

  constructor(private readonly paymentService: PaymentService) {}

  @Mutation(() => Payment, {
    description: 'Record a payment against an invoice'
  })

  async createPayment(
    @Args('input') input: CreatePaymentInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<Payment> {
    this.logger.log(`Creating payment for invoice ${input.invoiceId} by user ${user.sub}`);
    return await this.paymentService.createPayment(input, user);
  }

  @Mutation(() => Payment, {
    description: 'Update an existing payment'
  })
  async updatePayment(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdatePaymentInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<Payment> {
    this.logger.log(`Updating payment ${id} by user ${user.sub}`);
    return await this.paymentService.updatePayment(id, input, user);
  }

  @Mutation(() => Boolean, {
    description: 'Void/cancel a payment (soft delete)'
  })
  async voidPayment(
    @Args('id', { type: () => ID }) id: string,
    @Args('reason', { type: () => String }) reason: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<boolean> {
    this.logger.log(`Voiding payment ${id} by user ${user.sub}`);
    return await this.paymentService.voidPayment(id, reason, user);
  }

  @Mutation(() => Boolean, {
    description: 'Permanently delete a payment (admin only)'
  })
  async deletePayment(
    @Args('id', { type: () => ID }) id: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<boolean> {
    this.logger.log(`Deleting payment ${id} by user ${user.sub}`);
    return await this.paymentService.deletePayment(id, user);
  }

  @Query(() => Payment, {
    description: 'Get a single payment by ID'
  })
  async payment(
    @Args('id', { type: () => ID }) id: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<Payment> {
    this.logger.log(`Fetching payment ${id} by user ${user.sub}`);
    return await this.paymentService.findById(id, user);
  }

  @Query(() => [Payment], {
    description: 'Get all payments for the tenant with optional filters'
  })
  async payments(
    @Args('filters', { type: () => PaymentFilters, nullable: true }) filters: PaymentFilters,
    @ActiveUser() user: ActiveUserData,
  ): Promise<Payment[]> {
    this.logger.log(`Fetching payments for tenant ${user.tenantId}`);
    return await this.paymentService.findAll(filters, user);
  }

  @Query(() => [Payment], {
    description: 'Get all payments for a specific student'
  })
  async paymentsByStudent(
    @Args('studentId', { type: () => ID }) studentId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<Payment[]> {
    this.logger.log(`Fetching payments for student ${studentId}`);
    return await this.paymentService.findByStudent(studentId, user);
  }

  @Query(() => [Payment], {
    description: 'Get all payments for a specific invoice'
  })
  async paymentsByInvoice(
    @Args('invoiceId', { type: () => ID }) invoiceId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<Payment[]> {
    this.logger.log(`Fetching payments for invoice ${invoiceId}`);
    return await this.paymentService.findByInvoice(invoiceId, user);
  }
}


// import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
// import { UseGuards, Logger } from '@nestjs/common';
// import { Payment } from './entities/payment.entity';
// import { MembershipRole } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
// import { Roles } from 'src/iam/decorators/roles.decorator';
// import { CreatePaymentInput } from './dtos/create-payment.input';
// import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
// import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
// import { ObjectType, Field, Float, Int } from '@nestjs/graphql';

// @ObjectType({ description: 'Payment summary for a student' })
// export class PaymentSummary {
//   @Field(() => Float, { description: 'Total amount paid' })
//   totalPaid: number;

//   @Field(() => Float, { description: 'Total amount pending' })
//   totalPending: number;

//   @Field(() => Float, { description: 'Total amount refunded' })
//   totalRefunded: number;

//   @Field(() => Int, { description: 'Number of payments' })
//   paymentCount: number;
// }

// @Resolver(() => Payment)
// @Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.TEACHER)
// export class PaymentResolver {
//   private readonly logger = new Logger(PaymentResolver.name);

//   constructor(private readonly paymentService: PaymentService) {}

//   @Mutation(() => Payment, { 
//     description: 'Record a new payment'
//   })
//   @Roles(MembershipRole.SCHOOL_ADMIN)
//   async createPayment(
//     @Args('input') input: CreatePaymentInput,
//     @ActiveUser() user: ActiveUserData,
//   ): Promise<Payment> {
//     this.logger.log(`Recording payment for student ${input.studentId} by user ${user.sub}`);
//     return await this.paymentService.create(input, user);
//   }

//   @Query(() => [Payment], { 
//     description: 'Get all payments for the current tenant'
//   })
//   async payments(
//     @ActiveUser() user: ActiveUserData,
//   ): Promise<Payment[]> {
//     return await this.paymentService.findAll(user);
//   }

//   @Query(() => Payment, { 
//     description: 'Get a single payment by ID'
//   })
//   async payment(
//     @Args('id', { type: () => ID }) id: string,
//     @ActiveUser() user: ActiveUserData,
//   ): Promise<Payment> {
//     this.logger.log(`Fetching payment ${id} by user ${user.sub}`);
//     return await this.paymentService.findOne(id, user);
//   }

//   @Query(() => [Payment], { 
//     description: 'Get all payments for a specific student'
//   })
//   async paymentsByStudent(
//     @Args('studentId', { type: () => ID }) studentId: string,
//     @ActiveUser() user: ActiveUserData,
//   ): Promise<Payment[]> {
//     this.logger.log(`Fetching payments for student ${studentId} by user ${user.sub}`);
//     return await this.paymentService.findByStudent(studentId, user);
//   }

//   @Query(() => [Payment], { 
//     description: 'Get all payments for a specific invoice'
//   })
//   async paymentsByInvoice(
//     @Args('invoiceId', { type: () => ID }) invoiceId: string,
//     @ActiveUser() user: ActiveUserData,
//   ): Promise<Payment[]> {
//     this.logger.log(`Fetching payments for invoice ${invoiceId} by user ${user.sub}`);
//     return await this.paymentService.findByInvoice(invoiceId, user);
//   }

//   @Query(() => [Payment], { 
//     description: 'Get all payments with a specific status'
//   })
//   async paymentsByStatus(
//     @Args('status', { type: () => PaymentStatus }) status: PaymentStatus,
//     @ActiveUser() user: ActiveUserData,
//   ): Promise<Payment[]> {
//     this.logger.log(`Fetching payments with status ${status} by user ${user.sub}`);
//     return await this.paymentService.findByStatus(status, user);
//   }

//   @Query(() => Payment, { 
//     description: 'Get a payment by reference number'
//   })
//   async paymentByReferenceNumber(
//     @Args('referenceNumber') referenceNumber: string,
//     @ActiveUser() user: ActiveUserData,
//   ): Promise<Payment> {
//     this.logger.log(`Fetching payment with reference ${referenceNumber} by user ${user.sub}`);
//     return await this.paymentService.findByReferenceNumber(referenceNumber, user);
//   }

//   @Query(() => PaymentSummary, { 
//     description: 'Get payment summary for a specific student'
//   })
//   async paymentSummaryByStudent(
//     @Args('studentId', { type: () => ID }) studentId: string,
//     @ActiveUser() user: ActiveUserData,
//   ): Promise<PaymentSummary> {
//     this.logger.log(`Fetching payment summary for student ${studentId} by user ${user.sub}`);
//     return await this.paymentService.getPaymentSummaryByStudent(studentId, user);
//   }

//   @Mutation(() => Payment, { 
//     description: 'Update an existing payment'
//   })
//   @Roles(MembershipRole.SCHOOL_ADMIN)
//   async updatePayment(
//     @Args('id', { type: () => ID }) id: string,
//     @Args('input') input: UpdatePaymentInput,
//     @ActiveUser() user: ActiveUserData,
//   ): Promise<Payment> {
//     this.logger.log(`Updating payment ${id} by user ${user.sub}`);
//     return await this.paymentService.update(id, input, user);
//   }

//   @Mutation(() => Payment, { 
//     description: 'Refund a completed payment'
//   })
//   @Roles(MembershipRole.SCHOOL_ADMIN)
//   async refundPayment(
//     @Args('id', { type: () => ID }) id: string,
//     @ActiveUser() user: ActiveUserData,
//     @Args('refundReason', { nullable: true }) refundReason?: string,

//   ): Promise<Payment> {
//     this.logger.log(`Refunding payment ${id} by user ${user.sub}`);
//     return await this.paymentService.refund(id, user, refundReason);
//   }

//   @Mutation(() => Boolean, { 
//     description: 'Delete a payment (only for non-completed payments)'
//   })
//   @Roles(MembershipRole.SCHOOL_ADMIN)
//   async deletePayment(
//     @Args('id', { type: () => ID }) id: string,
//     @ActiveUser() user: ActiveUserData,
//   ): Promise<boolean> {
//     this.logger.log(`Deleting payment ${id} by user ${user.sub}`);
//     return await this.paymentService.remove(id, user);
//   }
// }