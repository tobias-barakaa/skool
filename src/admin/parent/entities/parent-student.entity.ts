import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Student } from 'src/admin/student/entities/student.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Parent } from './parent.entity';

@ObjectType()
@Entity('parent_students')
export class ParentStudent {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => ID)
  @Column('uuid')
  parentId: string;

  @Field(() => Parent)
  @ManyToOne(() => Parent, (parent) => parent.parentStudents)
  @JoinColumn({ name: 'parentId' })
  parent: Parent;

  @Field(() => ID)
  @Column('uuid')
  studentId: string;

  @Field(() => Student)
  @ManyToOne(() => Student)
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Field()
  @Column({ default: 'father' })
  relationship: string;

  @Field()
  @Column({ default: true })
  isPrimary: boolean;

  @Field(() => ID)
  @Column('uuid')
  tenantId: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
