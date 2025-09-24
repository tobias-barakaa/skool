import { Field, ID, ObjectType, GraphQLISODateTime, Float, registerEnumType } from "@nestjs/graphql";
import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { Student } from "src/admin/student/entities/student.entity";
import { User } from "src/admin/users/entities/user.entity";
import { AcademicYear } from "src/admin/academic_years/entities/academic_years.entity";
import { Term } from "src/admin/academic_years/entities/terms.entity";

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED'
}

registerEnumType(InvoiceStatus, {
  name: 'InvoiceStatus',
  description: 'The status of an invoice',
});

@Entity('invoices')
@ObjectType({ description: 'Represents an invoice for student fees' })
@Index(['tenantId', 'studentId'])
@Index(['tenantId', 'academicYearId', 'termId'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'dueDate'])
export class Invoice {
  @Field(() => ID, { description: 'The unique identifier of the invoice' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field({ description: 'The ID of the tenant this invoice belongs to' })
  @Column()
  tenantId: string;

  @Field({ description: 'The invoice number' })
  @Column({ unique: true })
  invoiceNumber: string;

  @Field(() => ID, { description: 'The ID of the student' })
  @Column()
  studentId: string;

  @Field(() => Student, { description: 'The student this invoice belongs to' })
  @ManyToOne(() => Student, { eager: true })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Field(() => ID, { description: 'The ID of the academic year' })
  @Column()
  academicYearId: string;

  @Field(() => AcademicYear, { description: 'The academic year this invoice belongs to' })
  @ManyToOne(() => AcademicYear, { eager: true })
  @JoinColumn({ name: 'academicYearId' })
  academicYear: AcademicYear;

  @Field(() => ID, { description: 'The ID of the term' })
  @Column()
  termId: string;

  @Field(() => Term, { description: 'The term this invoice belongs to' })
  @ManyToOne(() => Term, { eager: true })
  @JoinColumn({ name: 'termId' })
  term: Term;

  @Field(() => Float, { description: 'The total amount of the invoice' })
  @Column('decimal', { precision: 12, scale: 2 })
  totalAmount: number;

  @Field(() => Float, { description: 'The amount paid so far' })
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  paidAmount: number;

  @Field(() => Float, { description: 'The remaining balance' })
  @Column('decimal', { precision: 12, scale: 2 })
  balance: number;

  @Field(() => InvoiceStatus, { description: 'The status of the invoice' })
  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.PENDING
  })
  status: InvoiceStatus;

  @Field(() => GraphQLISODateTime, { description: 'The date when the invoice was issued' })
  @Column({ type: 'date' })
  issueDate: Date;

  @Field(() => GraphQLISODateTime, { description: 'The due date for payment' })
  @Column({ type: 'date' })
  dueDate: Date;

  @Field({ nullable: true, description: 'Additional notes or description' })
  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Field(() => ID, { description: 'The ID of the user who created this invoice' })
  @Column()
  createdBy: string;

  @Field(() => User, { description: 'The user who created this invoice' })
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'createdBy' })
  createdByUser: User;

  @Field({ description: 'Indicates if the invoice is currently active' })
  @Column({ default: true })
  isActive: boolean;

  @Field(() => GraphQLISODateTime, { description: 'The date and time when the invoice was created' })
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => GraphQLISODateTime, { description: 'The date and time when the invoice was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;
}
