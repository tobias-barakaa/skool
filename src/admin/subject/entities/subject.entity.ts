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

  @Field(() => [CurriculumSubject], { nullable: 'itemsAndList' })
  @OneToMany(
    () => CurriculumSubject,
    (curriculumSubject) => curriculumSubject.subject,
  )
  curriculumSubjects: CurriculumSubject[];
}
