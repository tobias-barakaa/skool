import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  ManyToOne,
} from 'typeorm';
import { GradeLevel } from 'src/level/entities/grade-level.entity';
import { SchoolType } from './school-type';
import { Curriculum } from 'src/curriculum/entities/curicula.entity';
import { CurriculumSubject } from 'src/curriculum/entities/curriculum_subjects.entity';

@ObjectType()
@Entity()
export class SchoolLevel {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field(() => SchoolType)
  @ManyToOne(() => SchoolType, (type) => type.schoolLevels, { onDelete: 'CASCADE' })
  schoolType: SchoolType;

  @Field(() => [GradeLevel], { nullable: true })
  @OneToMany(() => GradeLevel, (grade) => grade.level, { cascade: true })
  gradeLevels: GradeLevel[];

  @Field(() => Curriculum, { nullable: true })
  @ManyToOne(() => Curriculum, (curriculum) => curriculum.schoolLevels, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  curriculum: Curriculum;

  @Field(() => [CurriculumSubject], { nullable: true })
  @OneToMany(() => CurriculumSubject, (cs) => cs.schoolLevel, {
    cascade: true,
  })
  curriculumSubjects: CurriculumSubject[];
}
