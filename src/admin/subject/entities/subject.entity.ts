import { Field, ID, ObjectType } from '@nestjs/graphql';
import { CurriculumSubject } from 'src/admin/curriculum/entities/curriculum_subjects.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';


@ObjectType()
@Entity('subjects')
export class Subject {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column()
  code: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  shortName?: string;

  // ADD THESE:
  @Field({ nullable: true })
  @Column({ nullable: true })
  subjectType?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  category?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  department?: string;

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

  @Field({ nullable: true })
  @Column({ nullable: true })
  curriculum?: string;

  @Field(() => [CurriculumSubject], { nullable: 'itemsAndList' })
  @OneToMany(() => CurriculumSubject, (cs) => cs.subject)
  curriculumSubjects: CurriculumSubject[];
}
