import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { FeeAssignment } from "./fee-assignment.entity";
import { TenantGradeLevel } from "src/admin/school-type/entities/tenant-grade-level";

@Entity('fee_assignment_grade_levels')
export class FeeAssignmentGradeLevel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  feeAssignmentId: string;

  @ManyToOne(() => FeeAssignment, fa => fa.gradeLevels, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'feeAssignmentId' })
  feeAssignment: FeeAssignment;

  @Column()
  tenantGradeLevelId: string;

  @ManyToOne(() => TenantGradeLevel, { eager: true })
  @JoinColumn({ name: 'tenantGradeLevelId' })
  tenantGradeLevel: TenantGradeLevel;
}
