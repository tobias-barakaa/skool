import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Level } from "../../level/entities/level.entities";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Curriculum } from "src/curriculum/entities/curicula.entity";
import { SchoolLevel } from "src/school-type/entities/school_level.entity";

// grade-level.entity.ts
@ObjectType()
@Entity()
export class GradeLevel {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string; 


  @ManyToOne(() => Level, (level) => level.gradeLevels, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'level_id' })
  level: Level;

  @ManyToOne(() => SchoolLevel, schoolLevel => schoolLevel.gradeLevels, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  schoolLevel?: SchoolLevel;

  @ManyToOne(() => Curriculum, curriculum => curriculum.gradeLevels, {
    nullable: false,
    onDelete: 'CASCADE', 
  })
  @JoinColumn({ name: 'curriculum_id' })
  curriculum: Curriculum;

  // @ManyToOne(() => Curriculum, curriculum => curriculum.gradeLevels)
  // curriculum: Curriculum;

  @Field()
  @Column()
  code: string; // 'Y1', 'Y10', 'NUR'

  @Field()
  @Column({ type: 'int' })
  order: number; // For sorting/progression
}

