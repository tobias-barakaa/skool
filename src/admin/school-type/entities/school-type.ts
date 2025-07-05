import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Curriculum } from 'src/admin/curriculum/entities/curicula.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Level } from '../../level/entities/level.entities';
import { School } from '../../school/entities/school.entity';
import { SchoolLevel } from './school_level.entity';

@ObjectType()
@Entity()
export class SchoolType {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field(() => [Level], { nullable: true })
  @OneToMany(() => Level, (level) => level.schoolType, { cascade: true })
  levels: Level[];

  @Field(() => [School], { nullable: true })
  @OneToMany(() => School, (school) => school.schoolType)
  schools: School[];

  @Field(() => [SchoolLevel], { nullable: true })
  @OneToMany(() => SchoolLevel, (schoolLevel) => schoolLevel.schoolType, {
    cascade: true,
  })
  schoolLevels: SchoolLevel[];

  @Field({ nullable: true })
  @Column({ nullable: true })
  description: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  icon: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  priority: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  code: string;

  @OneToMany(() => Curriculum, (curriculum) => curriculum.schoolType)
  curricula: Curriculum[];
}
