import { Field, ID, ObjectType, GraphQLISODateTime } from "@nestjs/graphql";
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index, Unique } from "typeorm";
import { FeeStructureItem } from "../../fee-structure-item/entities/fee-structure-item.entity";
import { Student } from "src/admin/student/entities/student.entity";

@Entity('fee_assignments')
@ObjectType({ description: 'Represents assignment of fee structure items to specific students' })
@Unique(['tenantId', 'studentId', 'feeStructureItemId'])
@Index(['tenantId', 'studentId'])
@Index(['tenantId', 'feeStructureItemId'])
export class FeeAssignment {
  @Field(() => ID, { description: 'The unique identifier of the fee assignment' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field({ description: 'The ID of the tenant this fee assignment belongs to' })
  @Column()
  tenantId: string;

  @Field(() => ID, { description: 'The ID of the student' })
  @Column()
  studentId: string;

  @Field(() => Student, { description: 'The student this fee is assigned to' })
  @ManyToOne(() => Student, { eager: true })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Field(() => FeeStructureItem, { description: 'The fee structure item assigned to the student' })
  @ManyToOne(() => FeeStructureItem, { eager: true })
  @JoinColumn({ name: 'feeStructureItemId' })
  feeStructureItem: FeeStructureItem;

  @Field(() => ID, { description: 'The ID of the fee structure item' })
  @Column()
  feeStructureItemId: string;

  @Field({ description: 'Indicates if the fee assignment is currently active' })
  @Column({ default: true })
  isActive: boolean;

  @Field(() => GraphQLISODateTime, { description: 'The date and time when the fee assignment was created' })
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => GraphQLISODateTime, { description: 'The date and time when the fee assignment was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;
}