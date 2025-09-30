import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { Logger } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { Invoice } from './entities/invoice.entity';
import { CreateInvoiceInput } from './dtos/create-invoice.input';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { Payment } from '../payment/entities/payment.entity';


@Resolver(() => Invoice)
export class InvoiceResolver {
  private readonly logger = new Logger(InvoiceResolver.name);

  constructor(private readonly invoiceService: InvoiceService) {}

  @Mutation(() => [Invoice], {
    description: 'Generate invoices for students based on their fee assignments'
  })
  async generateInvoices(
    @Args('input') input: CreateInvoiceInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<Invoice[]> {
    this.logger.log(`Generating invoices for term ${input.termId} by user ${user.sub}`);
    return await this.invoiceService.generateInvoices(input, user);
  }

  // @Mutation(() => Payment, {
  //   description: 'Record a payment against an invoice'
  // })
  // async createPayments(
  //   @Args('input') input: CreatePaymentInput,
  //   @ActiveUser() user: ActiveUserData,
  // ): Promise<Payment> {
  //   this.logger.log(`Creating payment for invoice ${input.invoiceId} by user ${user.sub}`);
  //   return await this.invoiceService.createPayment(input, user);
  // }

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

  @Query(() => Invoice, {
    description: 'Get a single invoice by ID'
  })
  async invoice(
    @Args('id', { type: () => ID }) id: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<Invoice> {
    this.logger.log(`Fetching invoice ${id} by user ${user.sub}`);
    return await this.invoiceService.findById(id, user);
  }

  @Query(() => [Invoice], {
    description: 'Get all invoices for the tenant'
  })
  async invoices(
    @ActiveUser() user: ActiveUserData,
  ): Promise<Invoice[]> {
    this.logger.log(`Fetching all invoices for tenant ${user.tenantId} by user ${user.sub}`);
    return await this.invoiceService.findAllByTenant(user);
  }
}