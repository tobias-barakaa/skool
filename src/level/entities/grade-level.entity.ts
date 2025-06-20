import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Level } from "../../level/entities/level.entities";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

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

  @Field()
  @Column()
  age: number;

  @ManyToOne(() => Level, (level) => level.gradeLevels)
  level: Level;
}

