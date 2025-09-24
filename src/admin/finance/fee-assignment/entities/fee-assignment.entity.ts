import { Field, ID, ObjectType, GraphQLISODateTime, Int } from "@nestjs/graphql";
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from "typeorm";
import { FeeStructure } from "../../fee-structure/entities/fee-structure.entity";
import { User } from "src/admin/users/entities/user.entity";
import { StudentFeeAssignment } from "./student_fee_assignments.entity";
import { FeeAssignmentGradeLevel } from "./fee_assignment_grade_levels.entity";

@Entity('fee_assignments')
@ObjectType({ description: 'Represents bulk assignment of fee structure to students in specific grade levels' })
@Index(['tenantId', 'feeStructureId'])
@Index(['tenantId', 'assignedBy'])
export class FeeAssignment {
  @Field(() => ID, { description: 'The unique identifier of the fee assignment' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field({ description: 'The ID of the tenant this fee assignment belongs to' })
  @Column()
  tenantId: string;

  @Field(() => ID, { description: 'The ID of the fee structure being assigned' })
  @Column()
  feeStructureId: string;

  @Field(() => FeeStructure, { description: 'The fee structure being assigned' })
  @ManyToOne(() => FeeStructure, { eager: true })
  @JoinColumn({ name: 'feeStructureId' })
  feeStructure: FeeStructure;

 
  @OneToMany(() => FeeAssignmentGradeLevel, agl => agl.feeAssignment, { cascade: true })
  gradeLevels: FeeAssignmentGradeLevel[];

  @Field(() => ID, { description: 'The ID of the user who created this assignment' })
  @Column({ type: 'uuid' })
  assignedBy: string;

 

  @Field(() => Int)
  @Column({ default: 0 }) 
  studentsAssignedCount: number;

  
    @Field(() => User)
    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'assignedBy' })
    assignedByUser: User;

  @Field({ nullable: true, description: 'Optional description or notes about this assignment' })
  @Column({ nullable: true })
  description?: string;

  @Field({ description: 'Indicates if the fee assignment is currently active' })
  @Column({ default: true })
  isActive: boolean;


  @Field(() => [StudentFeeAssignment], { description: 'Individual student assignments created from this bulk assignment' })
  @OneToMany(() => StudentFeeAssignment, sfa => sfa.feeAssignment, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  studentAssignments: StudentFeeAssignment[];

  @Field(() => GraphQLISODateTime, { description: 'The date and time when the fee assignment was created' })
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => GraphQLISODateTime, { description: 'The date and time when the fee assignment was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;
}
