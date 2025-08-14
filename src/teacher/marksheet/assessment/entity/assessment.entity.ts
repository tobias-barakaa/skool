import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { GradeLevel } from 'src/admin/level/entities/grade-level.entity';
import { TenantGradeLevel } from 'src/admin/school-type/entities/tenant-grade-level';
import { TenantSubject } from 'src/admin/school-type/entities/tenant-specific-subject';
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
import { AssessType } from '../enums/assesment-type.enum';
import { AssesStatus } from '../enums/assesment-status.enum';

@ObjectType()
@Entity()
export class Assessment {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /* --- tenant ownership --------------------------------------------- */
  @Field(() => Tenant)
  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  tenantId: string;

  /* --- tenant grade level ------------------------------------------- */
  @Field(() => TenantGradeLevel)
  @ManyToOne(() => TenantGradeLevel, { eager: true })
  @JoinColumn({ name: 'tenantGradeLevelId' })
  tenantGradeLevel: TenantGradeLevel;

  @Column()
  tenantGradeLevelId: string;

  /* --- tenant subject ----------------------------------------------- */
  @Field(() => TenantSubject)
  @ManyToOne(() => TenantSubject, { eager: true })
  @JoinColumn({ name: 'tenantSubjectId' })
  tenantSubject: TenantSubject;

  @Field()
  @Column()
  tenantSubjectId: string;

  // FIXED: Changed from 'number' to 'decimal' or 'float' for PostgreSQL
  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  cutoff?: number;

  /* everything else stays the same … */
  @Field()
  @Column()
  title: string;

  @Field(() => AssessType)
  @Column({ type: 'enum', enum: AssessType })
  type: AssessType;

  @Field(() => AssesStatus)
  @Column({
    type: 'enum',
    enum: AssesStatus,
    default: AssesStatus.UPCOMING,
  })
  status: AssesStatus;

  @Field()
  @Column({ type: 'int' })
  term: number;

  @Field({ nullable: true })
  @Column({ type: 'date', nullable: true })
  date?: Date;

  @Field({ nullable: true })
  @Column({ type: 'int', nullable: true })
  maxScore?: number;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;
}
