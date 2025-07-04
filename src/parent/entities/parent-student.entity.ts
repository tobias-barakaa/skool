import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from 'src/users/entities/user.entity';
import { Parent } from './parent.entity';
import { Student } from 'src/student/entities/student.entity';


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
