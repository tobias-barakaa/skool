import { Field, ID, ObjectType, GraphQLISODateTime, Float, registerEnumType } from "@nestjs/graphql";
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

import { User } from "src/admin/users/entities/user.entity";
import { Invoice } from "../../invoice/entities/invoice.entity";
import { Student } from "src/admin/student/entities/student.entity";

export enum PaymentMethod {
  CASH = 'CASH',
  MPESA = 'MPESA',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHEQUE = 'CHEQUE',
  CARD = 'CARD',
  OTHER = 'OTHER'
}

registerEnumType(PaymentMethod, {
  name: 'PaymentMethod',
});

@Entity('payments')
@ObjectType({ description: 'Represents a payment made towards an invoice' })
@Index(['tenantId', 'invoiceId'])
@Index(['tenantId', 'studentId'])
@Index(['tenantId', 'receiptNumber'])
export class Payment {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  tenantId: string;

  @Field()
  @Column({ unique: true })
  receiptNumber: string;

  @Field(() => ID)
  @Column()
  invoiceId: string;

  @Field(() => Invoice)
  @ManyToOne(() => Invoice, invoice => invoice.payments)
  @JoinColumn({ name: 'invoiceId' })
  invoice: Invoice;

  @Field(() => ID)
  @Column()
  studentId: string;

  @Field(() => Student)
  @ManyToOne(() => Student)
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Field(() => Float)
  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Field(() => PaymentMethod)
  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.CASH
  })
  paymentMethod: PaymentMethod;

  @Field({ nullable: true })
  @Column({ nullable: true })
  transactionReference?: string;

  @Field(() => GraphQLISODateTime)
  @Column({ type: 'timestamp' })
  paymentDate: Date;

  @Field(() => ID)
  @Column()
  receivedBy: string;

  @Field(() => User)
  @ManyToOne(() => User)
  @JoinColumn({ name: 'receivedBy' })
  receivedByUser: User;

  @Field({ nullable: true })
  @Column({ nullable: true })
  notes?: string;

  @Field(() => GraphQLISODateTime)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => GraphQLISODateTime)
  @UpdateDateColumn()
  updatedAt: Date;
  isVoided: boolean;
  voidedAt: Date;
  voidedBy: string;
}
