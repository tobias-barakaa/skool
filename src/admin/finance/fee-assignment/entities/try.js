// // ==================== INVOICE ENTITIES ====================
// // File: src/billing/invoice/entities/invoice.entity.ts


// // @Entity('invoice_items')
// // @ObjectType({ description: 'Represents individual items in an invoice' })
// // @Index(['tenantId', 'invoiceId'])
// // export class InvoiceItem {
// //   @Field(() => ID)
// //   @PrimaryGeneratedColumn('uuid')
// //   id: string;

// //   @Field()
// //   @Column()
// //   tenantId: string;

// //   @Field(() => ID)
// //   @Column()
// //   invoiceId: string;

// //   @Field(() => Invoice)
// //   @ManyToOne(() => Invoice, invoice => invoice.items, { onDelete: 'CASCADE' })
// //   @JoinColumn({ name: 'invoiceId' })
// //   invoice: Invoice;

// //   @Field()
// //   @Column()
// //   description: string;

// //   @Field(() => Float)
// //   @Column('decimal', { precision: 12, scale: 2 })
// //   amount: number;

// //   @Field()
// //   @Column({ default: true })
// //   isMandatory: boolean;

// //   @Field(() => ID, { nullable: true })
// //   @Column({ nullable: true })
// //   feeStructureItemId?: string;

// //   @Field(() => GraphQLISODateTime)
// //   @CreateDateColumn()
// //   createdAt: Date;

// //   @Field(() => GraphQLISODateTime)
// //   @UpdateDateColumn()
// //   updatedAt: Date;
// // }

// // ==================== DTOs ====================
// // File: src/billing/invoice/dto/invoice.dto.ts


// // ==================== SERVICE ====================
// // File: src/billing/invoice/invoice.service.ts



// // ==================== RESOLVER ====================
// // File: src/billing/invoice/invoice.resolver.ts

// import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
// import { UseGuards, Logger } from '@nestjs/common';
// import { ActiveUser } from '../authentication/decorators/active-user.decorator';
// import { AuthenticationGuard } from '../authentication/guards/authentication.guard';

// @Resolver(() => Invoice)
// @UseGuards(AuthenticationGuard)
// export class InvoiceResolver {
//   private readonly logger = new Logger(InvoiceResolver.name);

//   constructor(private readonly invoiceService: InvoiceService) {}

//   @Mutation(() => Invoice, { description: 'Create an invoice for a single student' })
//   async createInvoice(
//     @Args('input') input: CreateInvoiceInput,
//     @ActiveUser() user: ActiveUserData,
//   ): Promise<Invoice> {
//     this.logger.log(`Creating invoice for student ${input.studentId} by user ${user.sub}`);
//     return this.invoiceService.createInvoiceForStudent(input, user);
//   }

//   @Mutation(() => BulkInvoiceResult, { description: 'Create invoices for all students in specified grade levels' })
//   async createBulkInvoices(
//     @Args('input') input: CreateBulkInvoicesInput,
//     @ActiveUser() user: ActiveUserData,
//   ): Promise<BulkInvoiceResult> {
//     this.logger.log(`Creating bulk invoices for grades ${input.tenantGradeLevelIds.join(', ')}`);
//     return this.invoiceService.createBulkInvoices(input, user);
//   }

//   @Mutation(() => Payment, { description: 'Record a payment against an invoice' })
//   async recordPayment(
//     @Args('input') input: CreatePaymentInput,
//     @ActiveUser() user: ActiveUserData,
//   ): Promise<Payment> {
//     this.logger.log(`Recording payment for invoice ${input.invoiceId}`);
//     return this.invoiceService.recordPayment(input, user);
//   }

//   @Query(() => Invoice, { description: 'Get a single invoice by ID' })
//   async invoice(
//     @Args('id', { type: () => ID }) id: string,
//     @ActiveUser() user: ActiveUserData,
//   ): Promise<Invoice> {
//     return this.invoiceService.findById(id, user);
//   }

//   @Query(() => [Invoice], { description: 'Get all invoices for a specific student' })
//   async invoicesByStudent(
//     @Args('studentId', { type: () => ID }) studentId: string,
//     @ActiveUser() user: ActiveUserData,
//   ): Promise<Invoice[]> {
//     this.logger.log(`Fetching invoices for student ${studentId} by user ${user.sub}`);
//     return this.invoiceService.findByStudent(studentId, user);
//   }

//   @Query(() => [Invoice], { description: 'Get all invoices for a specific term' })
//   async invoicesByTerm(
//     @Args('termId', { type: () => ID }) termId: string,
//     @ActiveUser() user: ActiveUserData,
//   ): Promise<Invoice[]> {
//     return this.invoiceService.findByTerm(termId, user);
//   }

//   @Query(() => Payment, { description: 'Get a single payment by ID' })
//   async payment(
//     @Args('id', { type: () => ID }) id: string,
//     @ActiveUser() user: ActiveUserData,
//   ): Promise<Payment> {
//     return this.invoiceService.findPaymentById(id, user);
//   }

//   @Query(() => [Payment], { description: 'Get all payments for an invoice' })
//   async paymentsByInvoice(
//     @Args('invoiceId', { type: () => ID }) invoiceId: string,
//     @ActiveUser() user: ActiveUserData,
//   ): Promise<Payment[]> {
//     return this.invoiceService.findPaymentsByInvoice(invoiceId, user);
//   }
// }

// // ==================== MODULE ====================
// // File: src/billing/invoice/invoice.module.ts

// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { Invoice, InvoiceItem, Payment } from './entities/invoice.entity';
// import { InvoiceService } from './invoice.service';
// import { InvoiceResolver } from './invoice.resolver';

// @Module({
//   imports: [TypeOrmModule.forFeature([Invoice, InvoiceItem, Payment])],
//   providers: [InvoiceService, InvoiceResolver],
//   exports: [InvoiceService],
// })
// export class InvoiceModule {}