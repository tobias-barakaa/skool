import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { GradeLevel } from 'src/level/entities/grade-level.entity';
import { SchoolType } from 'src/school-type/entities/school-type';
import { CurriculumSubject } from './curriculum_subjects.entity';
import { SchoolLevel } from 'src/school-type/entities/school_level.entity';

@ObjectType() 
@Entity('curricula')
export class Curriculum {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column()
  code: string;

  @Field()
  @Column()
  display_name: string;

  @Field(() => SchoolType, { nullable: true })
  @ManyToOne(() => SchoolType, schoolType => schoolType.curricula)
  schoolType: SchoolType;

  @Field(() => [GradeLevel], { nullable: 'items' })
  @OneToMany(() => GradeLevel, gradeLevel => gradeLevel.curriculum)
  gradeLevels: GradeLevel[];

  @Field(() => [CurriculumSubject], { nullable: 'items' })
  @OneToMany(() => CurriculumSubject, curriculumSubject => curriculumSubject.curriculum)
  curriculumSubjects: CurriculumSubject[];


@Field(() => [SchoolLevel], { nullable: 'items' })
@OneToMany(() => SchoolLevel, (schoolLevel) => schoolLevel.curriculum)
schoolLevels: SchoolLevel[];
}
