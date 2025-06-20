import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ObjectType, Field, ID } from "@nestjs/graphql";
import { Level } from "../../level/entities/level.entities";
import { School } from "../../school/entities/school.entity"; // <-- Ensure correct import path

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
  @OneToMany(() => Level, level => level.schoolType, { cascade: true })
  levels: Level[];

  @Field(() => [School], { nullable: true })
  @OneToMany(() => School, (school) => school.schoolType)
  schools: School[];

  @Field({ nullable: true })
  @Column({ nullable: true })
  description: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  icon: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  priority: number;
}
