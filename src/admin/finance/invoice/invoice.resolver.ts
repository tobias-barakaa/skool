import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards, Logger } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { MembershipRole } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { Roles } from 'src/iam/decorators/roles.decorator';
import { CreateInvoiceInput, UpdateInvoiceInput } from './dtos/create-invoice.input';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { Invoice, InvoiceStatus } from './invoice.entity';

@Resolver(() => Invoice)
@Roles(MembershipRole.SCHOOL_ADMIN)
export class InvoiceResolver {
  private readonly logger = new Logger(InvoiceResolver.name);

  constructor(private readonly invoiceService: InvoiceService) {}

  @Mutation(() => Invoice, { 
    description: 'Create a new invoice'
  })
  @Roles(MembershipRole.SCHOOL_ADMIN)
  async createInvoice(
    @Args('input') input: CreateInvoiceInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<Invoice> {
    this.logger.log(`Creating invoice for student ${input.studentId} by user ${user.sub}`);
    return await this.invoiceService.create(input, user);
  }

  @Query(() => [Invoice], { 
    description: 'Get all invoices for the current tenant'
  })
  async invoices(
    @ActiveUser() user: ActiveUserData,
  ): Promise<Invoice[]> {
    return await this.invoiceService.findAll(user);
  }

  @Query(() => Invoice, { 
    description: 'Get a single invoice by ID'
  })
  async invoice(
    @Args('id', { type: () => ID }) id: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<Invoice> {
    this.logger.log(`Fetching invoice ${id} by user ${user.sub}`);
    return await this.invoiceService.findOne(id, user);
  }

  @Query(() => [Invoice], { 
    description: 'Get all invoices for a specific student'
  })
  async invoicesByStudent(
    @Args('studentId', { type: () => ID }) studentId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<Invoice[]> {
    this.logger.log(`Fetching invoices for student ${studentId} by user ${user.sub}`);
    return await this.invoiceService.findByStudent(studentId, user);
  }

  @Query(() => [Invoice], { 
    description: 'Get all invoices with a specific status'
  })
  async invoicesByStatus(
    @Args('status', { type: () => InvoiceStatus }) status: InvoiceStatus,
    @ActiveUser() user: ActiveUserData,
  ): Promise<Invoice[]> {
    this.logger.log(`Fetching invoices with status ${status} by user ${user.sub}`);
    return await this.invoiceService.findByStatus(status, user);
  }

  @Query(() => [Invoice], { 
    description: 'Get all overdue invoices'
  })
  async overdueInvoices(
    @ActiveUser() user: ActiveUserData,
  ): Promise<Invoice[]> {
    this.logger.log(`Fetching overdue invoices by user ${user.sub}`);
    return await this.invoiceService.findOverdueInvoices(user);
  }

  @Mutation(() => Invoice, { 
    description: 'Update an existing invoice'
  })
  @Roles(MembershipRole.SCHOOL_ADMIN)
  async updateInvoice(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateInvoiceInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<Invoice> {
    this.logger.log(`Updating invoice ${id} by user ${user.sub}`);
    return await this.invoiceService.update(id, input, user);
  }

  @Mutation(() => Invoice, { 
    description: 'Update the payment status of an invoice'
  })
  @Roles(MembershipRole.SCHOOL_ADMIN)
  async updateInvoicePaymentStatus(
    @Args('id', { type: () => ID }) id: string,
    @Args('paidAmount', { type: () => Number }) paidAmount: number,
    @ActiveUser() user: ActiveUserData,
  ): Promise<Invoice> {
    this.logger.log(`Updating payment status for invoice ${id} by user ${user.sub}`);
    return await this.invoiceService.updatePaymentStatus(id, paidAmount, user);
  }

  @Mutation(() => Boolean, { 
    description: 'Delete an invoice'
  })
  @Roles(MembershipRole.SCHOOL_ADMIN)
  async deleteInvoice(
    @Args('id', { type: () => ID }) id: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<boolean> {
    this.logger.log(`Deleting invoice ${id} by user ${user.sub}`);
    return await this.invoiceService.remove(id, user);
  }
}