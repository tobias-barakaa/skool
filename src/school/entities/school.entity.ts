// src/schools/entities/school.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import { Field, ObjectType, ID } from '@nestjs/graphql';
import { Teacher } from '../../teacher/entities/teacher.entity';
import { Parent } from '../../parent/entities/parent.entity';
import { Class } from '../../class/entities/class.entity';
import { Student } from '../../student/entities/student.entity';
import { SchoolLevelSetting } from '../../school-level-setting/entities/school-level-setting.entity';
import { SchoolType } from '../../school-type/entities/school-type';
import { Tenant } from 'src/tenants/entities/tenant.entity';

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


  @OneToMany(() => Parent, (parent) => parent.school)
  parents: Parent[];

  // @Field(() => Subject)
  // @ManyToOne(() => Subject, (subject: Subject) => subject.subjectId)
  // subject: Subject;

  @Field(() => [Class])
  @OneToMany(() => Class, (cls) => cls.school)
  classes: Class[];


  

  @Field(() => [Student])
  @OneToMany(() => Student, (student) => student.school)
  students: Student[];

  @UpdateDateColumn()
  @Field(() => Date)
  updatedAt: Date;

  @OneToMany(() => SchoolLevelSetting, setting => setting.school)
  levelSettings: SchoolLevelSetting[];


  @ManyToOne(() => Tenant, tenant => tenant.schools)
  tenant: Tenant;
}


