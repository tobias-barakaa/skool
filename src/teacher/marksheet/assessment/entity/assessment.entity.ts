import { GradeLevel } from 'src/admin/level/entities/grade-level.entity';
import { Subject } from 'src/admin/subject/entities/subject.entity';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';


export enum AssessmentType {
  CA = 'CA',
  EXAM = 'EXAM',
}

export enum AssessmentStatus {
  UPCOMING = 'UPCOMING',
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
}

@Entity()
export class Assessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ enum: AssessmentType })
  type: AssessmentType;

  @Column({ length: 50 })
  title: string; // e.g., CA1, CA2, Midterm, Final

  @Column({ type: 'numeric' })
  cutoff: number; // e.g., 30 for CA, 70 for Exam

  @Column({ enum: AssessmentStatus, default: AssessmentStatus.UPCOMING })
  status: AssessmentStatus;

  @ManyToOne(() => Subject, { eager: true })
  @JoinColumn({ name: 'subjectId' })
  subject: Subject;

  @Column()
  subjectId: string;

  @ManyToOne(() => GradeLevel, { eager: true })
  @JoinColumn({ name: 'gradeLevelId' })
  gradeLevel: GradeLevel;

  @Column()
  gradeLevelId: string;

  @Column()
  term: string; // e.g., TERM 1, TERM 2, or 2024 TERM 1

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
