
import { Field, ID, ObjectType, GraphQLISODateTime, Float, registerEnumType } from "@nestjs/graphql";
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, Index } from "typeorm";
import { Payment } from "../payment/entities/payment.entity";
import { Student } from "src/admin/student/entities/student.entity";

export enum ReceiptType {
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  ADJUSTMENT = 'ADJUSTMENT'
}

registerEnumType(ReceiptType, {
  name: 'ReceiptType',
});

@Entity('receipts')
@ObjectType({ description: 'Represents a payment receipt' })
@Index(['tenantId', 'receiptNumber'])
@Index(['tenantId', 'studentId'])
export class Receipt {
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
  paymentId: string;

  @Field(() => Payment)
  @ManyToOne(() => Payment)
  @JoinColumn({ name: 'paymentId' })
  payment: Payment;

  @Field(() => ID)
  @Column()
  studentId: string;

  @Field(() => Student)
  @ManyToOne(() => Student)
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Field(() => ReceiptType)
  @Column({
    type: 'enum',
    enum: ReceiptType,
    default: ReceiptType.PAYMENT
  })
  type: ReceiptType;

  @Field(() => Float)
  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Field(() => GraphQLISODateTime)
  @Column({ type: 'timestamp' })
  receiptDate: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  pdfUrl?: string;

  @Field(() => GraphQLISODateTime)
  @CreateDateColumn()
  createdAt: Date;
}
