import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Level } from "../../level/entities/level.entities";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Curriculum } from "src/curriculum/entities/curicula.entity";

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


  @ManyToOne(() => Level, (level) => level.gradeLevels)
  level: Level;

  @ManyToOne(() => Curriculum, curriculum => curriculum.gradeLevels)
  curriculum: Curriculum;

  @Field()
  @Column()
  code: string; // 'Y1', 'Y10', 'NUR'

  @Field()
  @Column({ type: 'int' })
  order: number; // For sorting/progression
}


// @Entity('grade_levels')
// export class GradeLevel {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @Column()
//   name: string; // 'Year 1', 'Year 10', 'Nursery'

//   @Column()
//   code: string; // 'Y1', 'Y10', 'NUR'

//   @Column({ type: 'int' })
//   order: number; // For sorting/progression

//   @ManyToOne(() => Curriculum, curriculum => curriculum.gradeLevels)
//   curriculum: Curriculum;
// }
