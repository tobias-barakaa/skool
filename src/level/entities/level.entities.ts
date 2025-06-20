import { Grade } from "../../grade/entities/grade.entity";
import { SchoolType } from "../../school-type/entities/school-type";
import { SchoolTypeConfig } from "../../school/dtos/school-type-config";
import { Subject } from "../../subject/entities/subject.entity";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { GradeLevel } from "../../level/entities/grade-level.entity";

@ObjectType()
@Entity()
export class Level {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description: string;

  @Field(() => SchoolTypeConfig)
  @ManyToOne(() => SchoolType, (schoolType) => schoolType.levels, { eager: true })
   schoolType: SchoolType;

  @Field(() => [Grade])
  @OneToMany(() => Grade, grade => grade.level, { cascade: true })
  grades: Grade[];

  @Field(() => [Subject])
  @OneToMany(() => Subject, subject => subject.level, { cascade: true })
  subjects: Subject[];

  @OneToMany(() => GradeLevel, (grade) => grade.level)
   gradeLevels: GradeLevel[];
}
