import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { Curriculum } from './curicula.entity';
import { Subject } from 'src/admin/subject/entities/subject.entity';
import { SubjectType } from 'src/admin/subject/enums/subject.type.enum';
import { SchoolLevel } from 'src/admin/school-type/entities/school_level.entity';
import { GradeLevel } from 'src/admin/level/entities/grade-level.entity';

@ObjectType()
@Entity('curriculum_subjects')
export class CurriculumSubject {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Curriculum)
  @ManyToOne(() => Curriculum, curriculum => curriculum.curriculumSubjects)
  curriculum: Curriculum;

  @Field(() => Subject)
  @ManyToOne(() => Subject, subject => subject.curriculumSubjects)
  subject: Subject;

  @Field(() => SubjectType)
  @Column({
    type: 'enum',
    enum: SubjectType
  })
  subjectType: SubjectType;

  @Field()
  @Column({ default: true })
  isActive: boolean;

  @Field({ nullable: true })
  @Column({ type: 'int', nullable: true })
  displayOrder: number;

  @Field(() => [GradeLevel], { nullable: true })
  @ManyToMany(() => GradeLevel)
  @JoinTable({ name: 'curriculum_subject_grades' })
  availableGrades: GradeLevel[];

  @Field(() => SchoolLevel, { nullable: true })
  @ManyToOne(() => SchoolLevel, (level) => level.curriculumSubjects, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  schoolLevel: SchoolLevel;

  // ✅ ADD THESE:
  @Field({ nullable: true })
  @Column({ nullable: true })
  isCompulsory?: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true })
  totalMarks?: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  passingMarks?: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  creditHours?: number;
}
