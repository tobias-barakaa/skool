import { Field, GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import { School } from '../../school/entities/school.entity';
import { User } from '../../users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TenantSubject } from 'src/admin/school-type/entities/tenant-specific-subject';
import { TenantGradeLevel } from 'src/admin/school-type/entities/tenant-grade-level';
import { TenantStream } from 'src/admin/school-type/entities/tenant-stream';
import { ClassTeacherAssignment } from './class_teacher_assignments.entity';

@ObjectType()
@Entity()
export class Teacher {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Field()
  @Column()
  fullName: string;

  @Field()
  @Column()
  firstName: string;

  @Field()
  @Column()
  lastName: string;

  @Field()
  @Column()
  email: string;

  @Field()
  @Column({ nullable: false })
  gender: string;

  @Field()
  @Column()
  department: string;

  @Field()
  @Column()
  phoneNumber: string;

  @Field()
  @Column()
  role: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  address?: string;

  @Field(() => [TenantSubject], { nullable: true })
  @ManyToMany(() => TenantSubject, { cascade: true })
  @JoinTable({ name: 'teacher_tenant_subjects' })
  tenantSubjects?: TenantSubject[];

  @Field(() => [TenantGradeLevel], { nullable: true })
  @ManyToMany(() => TenantGradeLevel, { cascade: true })
  @JoinTable({ name: 'teacher_tenant_grade_levels' })
  tenantGradeLevels?: TenantGradeLevel[];

  @Field(() => [TenantStream], { nullable: true })
  @ManyToMany(() => TenantStream, { cascade: true })
  @JoinTable({ name: 'teacher_tenant_streams' })
  tenantStreams?: TenantStream[];

  // REMOVE THESE - replaced by ClassTeacherAssignment entity
  // @Field(() => TenantStream, { nullable: true })
  // @ManyToOne(() => TenantStream, { nullable: true })
  // @JoinColumn({ name: 'class_teacher_tenant_stream_id' })
  // classTeacherOf?: TenantStream;

  // @Field(() => Boolean)
  // @Column({ default: false })
  // isClassTeacher: boolean;

  // classTeacherOfGradeLevel?: TenantGradeLevel;

  // ADD: Relationship to class teacher assignments
  @Field(() => [ClassTeacherAssignment], { nullable: true })
  @OneToMany(() => ClassTeacherAssignment, (assignment) => assignment.teacher)
  classTeacherAssignments?: ClassTeacherAssignment[];

  @Field({ nullable: true })
  @Column({ nullable: true })
  employeeId?: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @Column({ type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  qualifications?: string;

  @Field({ nullable: true })
  @Column({ default: false })
  isActive: boolean;

  @Field({ nullable: true })
  @Column({ default: false })
  hasCompletedProfile: boolean;

  @OneToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  @Field(() => User, { nullable: true })
  user?: User;

  @ManyToOne(() => School, { nullable: true })
  @Field(() => School, { nullable: true })
  school?: School;

  @CreateDateColumn()
  @Field(() => Date)
  createdAt: Date;

  @UpdateDateColumn()
  @Field(() => Date)
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: false })
  tenantId: string;

  @ManyToOne(() => Tenant, { nullable: false })
  @JoinColumn({ name: 'tenantId' })
  @Field(() => Tenant, { nullable: false })
  tenant: Tenant;
}
