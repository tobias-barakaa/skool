import { Field, GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { School } from '../../school/entities/school.entity';
import { User } from '../../users/entities/user.entity';
import { Subject } from 'src/admin/subject/entities/subject.entity';
import { GradeLevel } from 'src/admin/level/entities/grade-level.entity';
import { Stream } from 'src/admin/streams/entities/streams.entity';

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

  // Subjects (many-to-many)
  @Field(() => [Subject], { nullable: true })
  @ManyToMany(() => Subject, { cascade: true })
  @JoinTable()
  subjects?: Subject[];

  // Grade Levels (many-to-many)
  @Field(() => [GradeLevel], { nullable: true })
  @ManyToMany(() => GradeLevel, { cascade: true })
  @JoinTable()
  gradeLevels?: GradeLevel[];

  // Streams (many-to-many)
  @Field(() => [Stream], { nullable: true })
  @ManyToMany(() => Stream, { cascade: true })
  @JoinTable()
  streams?: Stream[];

  // Class Teacher Boolean
  @Field(() => Boolean)
  @Column({ default: false })
  isClassTeacher: boolean;

  // Class Teacher Stream (only if isClassTeacher === true)
  @Field(() => Stream, { nullable: true })
  @ManyToOne(() => Stream, { nullable: true })
  @JoinColumn()
  classTeacherOf?: Stream;

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
  @JoinColumn()
  @Field(() => User, { nullable: true })
  user?: User;

  @Column({ nullable: true })
  userId?: string;

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
