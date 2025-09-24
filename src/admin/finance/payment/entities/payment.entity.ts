import { Field, ID, ObjectType, GraphQLISODateTime, Float, registerEnumType } from "@nestjs/graphql";
import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from "typeorm";
import { Student } from "src/admin/student/entities/student.entity";
import { User } from "src/admin/users/entities/user.entity";
import { Invoice } from "../../invoice/invoice.entity";

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  MOBILE_MONEY = 'MOBILE_MONEY',
  CHEQUE = 'CHEQUE',
  CARD = 'CARD',
  ONLINE = 'ONLINE'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

registerEnumType(PaymentMethod, {
  name: 'PaymentMethod',
  description: 'The method used for payment',
});

registerEnumType(PaymentStatus, {
  name: 'PaymentStatus',
  description: 'The status of a payment',
});

@Entity('payments')
@ObjectType({ description: 'Represents a payment made by a student' })
@Index(['tenantId', 'studentId'])
@Index(['tenantId', 'invoiceId'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'paymentDate'])
@Index(['referenceNumber'])
export class Payment {
  @Field(() => ID, { description: 'The unique identifier of the payment' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field({ description: 'The ID of the tenant this payment belongs to' })
  @Column()
  tenantId: string;

  @Field({ description: 'The payment reference number' })
  @Column({ unique: true })
  referenceNumber: string;

  @Field(() => ID, { description: 'The ID of the student making the payment' })
  @Column()
  studentId: string;

  @Field(() => Student, { description: 'The student making the payment' })
  @ManyToOne(() => Student, { eager: true })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Field(() => ID, { nullable: true, description: 'The ID of the invoice this payment is for' })
  @Column({ nullable: true })
  invoiceId?: string;

  @Field(() => Invoice, { nullable: true, description: 'The invoice this payment is for' })
  @ManyToOne(() => Invoice, { eager: true, nullable: true })
  @JoinColumn({ name: 'invoiceId' })
  invoice?: Invoice;

  @Field(() => Float, { description: 'The amount paid' })
  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Field(() => PaymentMethod, { description: 'The method used for payment' })
  @Column({
    type: 'enum',
    enum: PaymentMethod
  })
  paymentMethod: PaymentMethod;

  @Field(() => PaymentStatus, { description: 'The status of the payment' })
  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING
  })
  status: PaymentStatus;

  @Field(() => GraphQLISODateTime, { description: 'The date when the payment was made' })
  @Column({ type: 'date' })
  paymentDate: Date;

  @Field({ nullable: true, description: 'Transaction ID from payment provider' })
  @Column({ nullable: true })
  transactionId?: string;

  @Field({ nullable: true, description: 'Additional notes about the payment' })
  @Column({ nullable: true, type: 'text' })
  notes?: string;

  @Field(() => ID, { description: 'The ID of the user who recorded this payment' })
  @Column()
  recordedBy: string;

  @Field(() => User, { description: 'The user who recorded this payment' })
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'recordedBy' })
  recordedByUser: User;

  @Field({ description: 'Indicates if the payment is currently active' })
  @Column({ default: true })
  isActive: boolean;

  @Field(() => GraphQLISODateTime, { description: 'The date and time when the payment was created' })
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => GraphQLISODateTime, { description: 'The date and time when the payment was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;
}