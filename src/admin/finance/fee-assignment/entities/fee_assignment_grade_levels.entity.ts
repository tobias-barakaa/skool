import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { FeeAssignment } from "./fee-assignment.entity";
import { TenantGradeLevel } from "src/admin/school-type/entities/tenant-grade-level";

@Entity('fee_assignment_grade_levels')
@ObjectType({ description: 'Junction table for fee assignments and grade levels' })
export class FeeAssignmentGradeLevel {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => ID)
  @Column()
  feeAssignmentId: string;

  @ManyToOne(() => FeeAssignment, fa => fa.gradeLevels, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'feeAssignmentId' })
  feeAssignment: FeeAssignment;

  @Field(() => ID)
  @Column()
  tenantGradeLevelId: string;

  @Field(() => TenantGradeLevel)
  @ManyToOne(() => TenantGradeLevel, { eager: true })
  @JoinColumn({ name: 'tenantGradeLevelId' })
  tenantGradeLevel: TenantGradeLevel;
}

// import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
// import { FeeAssignment } from "./fee-assignment.entity";
// import { TenantGradeLevel } from "src/admin/school-type/entities/tenant-grade-level";

// @Entity('fee_assignment_grade_levels')
// export class FeeAssignmentGradeLevel {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @Column()
//   feeAssignmentId: string;

//   @ManyToOne(() => FeeAssignment, fa => fa.gradeLevels, { onDelete: 'CASCADE' })
//   @JoinColumn({ name: 'feeAssignmentId' })
//   feeAssignment: FeeAssignment;

//   @Column()
//   tenantGradeLevelId: string;

//   @ManyToOne(() => TenantGradeLevel, { eager: true })
//   @JoinColumn({ name: 'tenantGradeLevelId' })
//   tenantGradeLevel: TenantGradeLevel;
// }



// fee_assignment_grade_levels.entity.ts

// import { Field, ID, ObjectType } from "@nestjs/graphql";
// import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
// import { FeeAssignment } from "./fee-assignment.entity";
// import { TenantGradeLevel } from "src/admin/school-type/entities/tenant-grade-level";

// @Entity('fee_assignment_grade_levels')
// @ObjectType({ description: 'Junction table for fee assignments and grade levels' })
// export class FeeAssignmentGradeLevel {
//   @Field(() => ID)
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @Field(() => ID)
//   @Column()
//   feeAssignmentId: string;

//   @ManyToOne(() => FeeAssignment, fa => fa.gradeLevels, { onDelete: 'CASCADE' })
//   @JoinColumn({ name: 'feeAssignmentId' })
//   feeAssignment: FeeAssignment;

//   @Field(() => ID)
//   @Column()
//   tenantGradeLevelId: string;

//   @Field(() => TenantGradeLevel)
//   @ManyToOne(() => TenantGradeLevel, { eager: true })
//   @JoinColumn({ name: 'tenantGradeLevelId' })
//   tenantGradeLevel: TenantGradeLevel;
// }