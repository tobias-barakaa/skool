import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
} from 'typeorm';
import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { Assessment } from '../assessment/entity/assessment.entity';
import { Student } from 'src/admin/student/entities/student.entity';



@ObjectType()
@Entity('assessment_marks')
export class AssessmentMark {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Float)
  @Column('float')
  score: number;

  @ManyToOne(() => Assessment, (assessment) => assessment.marks, {
    onDelete: 'CASCADE',
  })
  @Field(() => Assessment)
  assessment: Assessment;

  @Column('uuid')
  assessmentId: string;

  @ManyToOne(() => Student, (student) => student.marks, { onDelete: 'CASCADE' })
  @Field(() => Student)
  student: Student;

  @Column('uuid')
  studentId: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
