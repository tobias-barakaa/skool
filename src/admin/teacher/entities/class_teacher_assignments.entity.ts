import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  Index,
} from 'typeorm';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import { Teacher } from './teacher.entity';
import { TenantStream } from 'src/admin/school-type/entities/tenant-stream';
import { TenantGradeLevel } from 'src/admin/school-type/entities/tenant-grade-level';

@ObjectType()
@Entity('class_teacher_assignments')
// @Unique(['stream', 'active'])
// @Unique(['gradeLevel', 'active'])
@Index('uq_stream_active', ['stream'], { unique: true, where: '"active" = true' })
@Index('uq_grade_level_active', ['gradeLevel'], { unique: true, where: '"active" = true' })

export class ClassTeacherAssignment {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Tenant) 
  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Field(() => Teacher)
  @ManyToOne(() => Teacher, { onDelete: 'CASCADE' })
  teacher: Teacher;

  @Field(() => TenantStream, { nullable: true })
  @ManyToOne(() => TenantStream, { nullable: true, onDelete: 'CASCADE' })
  stream?: TenantStream;

  @Field(() => TenantGradeLevel, { nullable: true })
  @ManyToOne(() => TenantGradeLevel, { nullable: true, onDelete: 'CASCADE' })
  gradeLevel?: TenantGradeLevel;

  @Field()
  @Column({ default: true })
  active: boolean;

  @Field()
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  startDate: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  endDate?: Date;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
