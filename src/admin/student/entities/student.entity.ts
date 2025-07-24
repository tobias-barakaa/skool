// src/students/entities/student.entity.ts
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { GradeLevel } from 'src/admin/level/entities/grade-level.entity';
import { Stream } from 'src/admin/streams/entities/streams.entity';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import { User } from 'src/admin/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@ObjectType()
@Entity('students')
export class Student {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column({ unique: true })
  @Field()
  admission_number: string;

  @Column('uuid')
  @Field(() => ID)
  user_id: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  @Field(() => User)
  user: User;

  @Column()
  @Field()
  phone: string;

  @Column()
  @Field()
  gender: string;

  @ManyToOne(() => GradeLevel, {
    eager: true,
    nullable: false,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'grade_level_id' })
  @Field(() => GradeLevel)
  grade: GradeLevel;

  @Field()
  @Column({ default: 0 })
  feesOwed: number;

  @Field()
  @Column({ default: 0 })
  totalFeesPaid: number;

  @CreateDateColumn()
  @Field(() => Date)
  createdAt: Date;

  @Field()
  @Column({ default: true })
  isActive: boolean;

  @UpdateDateColumn()
  @Field(() => Date)
  updatedAt: Date;

  @ManyToOne(() => Stream, (stream) => stream.students, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  stream: Stream;

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  @Field(() => Tenant)
  tenant: Tenant;

  @Column('uuid')
  @Field(() => ID)
  tenant_id: string;
}
