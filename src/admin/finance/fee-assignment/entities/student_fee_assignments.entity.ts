import { Field, ID, ObjectType, GraphQLISODateTime } from "@nestjs/graphql";
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from "typeorm";
import { Student } from "src/admin/student/entities/student.entity";
import { FeeAssignment } from "./fee-assignment.entity";
import { StudentFeeItem } from "./student_fee_items.entity";

@Entity('student_fee_assignments')
@ObjectType({ description: 'Represents the assignment of a fee structure to a specific student' })
@Index(['tenantId', 'studentId'])
@Index(['tenantId', 'feeAssignmentId'])
export class StudentFeeAssignment {
  @Field(() => ID, { description: 'The unique identifier of the student fee assignment' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field({ description: 'The ID of the tenant this assignment belongs to' })
  @Column()
  tenantId: string;

  @Field(() => ID, { description: 'The ID of the student' })
  @Column()
  studentId: string;

  @Field(() => Student, { description: 'The student this fee assignment belongs to' })
  @ManyToOne(() => Student, { eager: true })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Field(() => ID, { description: 'The ID of the fee assignment' })
  @Column()
  feeAssignmentId: string;

  // @ManyToOne(() => FeeAssignment, { eager: true })
  // @JoinColumn({ name: 'feeAssignmentId' })
  // feeAssignment: FeeAssignment;

  @Field(() => FeeAssignment, { description: 'The fee assignment this belongs to' })
  @ManyToOne(() => FeeAssignment, fa => fa.studentAssignments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'feeAssignmentId' })
  feeAssignment: FeeAssignment;

  @Field({ description: 'Indicates if the assignment is currently active' })
  @Column({ default: true })
  isActive: boolean;

  @Field(() => [StudentFeeItem], { description: 'The fee items assigned to this student' })
  @OneToMany(() => StudentFeeItem, (item) => item.studentFeeAssignment, { cascade: true })
  feeItems: StudentFeeItem[];

  @Field(() => GraphQLISODateTime, { description: 'The date and time when the assignment was created' })
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => GraphQLISODateTime, { description: 'The date and time when the assignment was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;
}