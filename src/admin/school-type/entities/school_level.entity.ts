import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Curriculum } from 'src/admin/curriculum/entities/curicula.entity';
import { CurriculumSubject } from 'src/admin/curriculum/entities/curriculum_subjects.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SchoolType } from './school-type';
import { GradeLevel } from 'src/admin/level/entities/grade-level.entity';

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
  @ManyToOne(() => SchoolType, (type) => type.schoolLevels, {
    onDelete: 'CASCADE',
  })
  schoolType: SchoolType;

  //   @OneToMany(() => GradeLevel, gradeLevel => gradeLevel.schoolLevel, {
  //     cascade: true,
  //     eager: false,
  //   })
  //   @Field(() => [GradeLevel], { nullable: true })
  //   gradeLevels?: GradeLevel[];

  @OneToMany(() => GradeLevel, (gradeLevel) => gradeLevel.schoolLevel, {
    cascade: true,
    eager: false,
  })
  @Field(() => [GradeLevel], { nullable: true })
  gradeLevels?: GradeLevel[];

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
