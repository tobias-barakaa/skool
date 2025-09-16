import { Field, ID, ObjectType, Float, GraphQLISODateTime } from "@nestjs/graphql";
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";
import { FeeStructureItem } from "../../fee-structure-item/entities/fee-structure-item.entity";
import { StudentFeeAssignment } from "./student_fee_assignments.entity";

@Entity('student_fee_items')
@ObjectType({ description: 'Represents individual fee items assigned to a student' })
@Index(['tenantId', 'studentFeeAssignmentId'])
@Index(['tenantId', 'feeStructureItemId'])
export class StudentFeeItem {
  @Field(() => ID, { description: 'The unique identifier of the student fee item' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field({ description: 'The ID of the tenant this item belongs to' })
  @Column()
  tenantId: string;

  @Field(() => ID, { description: 'The ID of the student fee assignment' })
  @Column()
  studentFeeAssignmentId: string;

  @Field(() => StudentFeeAssignment, { description: 'The student fee assignment this item belongs to' })
  @ManyToOne(() => StudentFeeAssignment, (assignment) => assignment.feeItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentFeeAssignmentId' })
  studentFeeAssignment: StudentFeeAssignment;

  @Field(() => ID, { description: 'The ID of the fee structure item' })
  @Column()
  feeStructureItemId: string;

  @Field(() => FeeStructureItem, { description: 'The fee structure item this is based on' })
  @ManyToOne(() => FeeStructureItem, { eager: true })
  @JoinColumn({ name: 'feeStructureItemId' })
  feeStructureItem: FeeStructureItem;

  @Field(() => Float, { description: 'The amount for this fee item' })
  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Field({ description: 'Indicates if this fee item is mandatory' })
  @Column({ default: true })
  isMandatory: boolean;

  @Field({ description: 'Indicates if this fee item is currently active for the student' })
  @Column({ default: true })
  isActive: boolean;

  @Field(() => GraphQLISODateTime, { description: 'The date and time when the item was created' })
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => GraphQLISODateTime, { description: 'The date and time when the item was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;
}