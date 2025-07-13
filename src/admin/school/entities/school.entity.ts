// src/schools/entities/school.entity.ts
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SchoolLevelSetting } from '../../school-level-setting/entities/school-level-setting.entity';
import { SchoolType } from '../../school-type/entities/school-type';
import { Teacher } from '../../teacher/entities/teacher.entity';

@ObjectType()
@Entity()
export class School {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  schoolId: string;

  @Field()
  @Column()
  schoolName: string;

  @Field()
  @Column({ unique: true })
  subdomain: string;

  @Field(() => SchoolType)
  @ManyToOne(() => SchoolType, (type) => type.schools)
  schoolType: SchoolType;

  @Field()
  @Column({ default: true })
  isActive: boolean;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Teacher, (teacher) => teacher.school)
  teachers: Teacher[];

  // @OneToMany(() => Parent, (parent) => parent.school)
  // parents: Parent[];

  // @Field(() => Subject)
  // @ManyToOne(() => Subject, (subject: Subject) => subject.subjectId)
  // subject: Subject;


  @UpdateDateColumn()
  @Field(() => Date)
  updatedAt: Date;

  @OneToMany(() => SchoolLevelSetting, (setting) => setting.school)
  levelSettings: SchoolLevelSetting[];

  @ManyToOne(() => Tenant, (tenant) => tenant.schools)
  tenant: Tenant;
}
