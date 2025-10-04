import { Field, ID, ObjectType, GraphQLISODateTime, Float, registerEnumType } from "@nestjs/graphql";
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";
import { Term } from "src/admin/academic_years/entities/terms.entity";
import { AcademicYear } from "src/admin/academic_years/entities/academic_years.entity";
import { Student } from "src/admin/student/entities/student.entity";
import { InvoiceItem } from "./invoice.entity.item";
import { Payment } from "../../payment/entities/payment.entity";

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED'
}

registerEnumType(InvoiceStatus, {
  name: 'InvoiceStatus',
});

// @Entity('invoices')
// @ObjectType({ description: 'Represents a student invoice' })
// @Index(['tenantId', 'studentId'])
// @Index(['tenantId', 'termId'])
// @Index(['tenantId', 'invoiceNumber'])
// @Index(['tenantId', 'status'])
@Entity('invoices')
@ObjectType({ description: 'Represents a student invoice' })
@Index(['tenantId', 'studentId'])
@Index(['tenantId', 'termId'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'invoiceNumber'], { unique: true }) 
export class Invoice {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  tenantId: string;

  @Index(['tenantId', 'invoiceNumber'], { unique: true })
@Column()
invoiceNumber: string;

  @Field(() => ID)
  @Column()
  studentId: string;

  @Field(() => Student)
  @ManyToOne(() => Student)
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Field(() => ID)
  @Column()
  termId: string;

  @Field(() => Term)
  @ManyToOne(() => Term)
  @JoinColumn({ name: 'termId' })
  term: Term;

  @Field(() => ID)
  @Column()
  academicYearId: string;

  @Field(() => AcademicYear)
  @ManyToOne(() => AcademicYear)
  @JoinColumn({ name: 'academicYearId' })
  academicYear: AcademicYear;

  @Field(() => GraphQLISODateTime)
  @Column({ type: 'timestamp' })
  issueDate: Date;

  @Field(() => GraphQLISODateTime)
  @Column({ type: 'timestamp' })
  dueDate: Date;

  @Field(() => Float)
  @Column('decimal', { precision: 12, scale: 2 })
  totalAmount: number;

  @Field(() => Float)
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  paidAmount: number;

  @Field(() => Float)
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  balanceAmount: number;

  @Field(() => InvoiceStatus)
  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.PENDING
  })
  status: InvoiceStatus;

  @Field({ nullable: true })
  @Column({ nullable: true })
  notes?: string;

  @Field(() => [InvoiceItem])
  @OneToMany(() => InvoiceItem, item => item.invoice, { cascade: true })
  items: InvoiceItem[];

  @Field(() => [Payment], { nullable: true })
  @OneToMany(() => Payment, payment => payment.invoice)
  payments?: Payment[];

  @Field(() => GraphQLISODateTime)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => GraphQLISODateTime)
  @UpdateDateColumn()
  updatedAt: Date;
}