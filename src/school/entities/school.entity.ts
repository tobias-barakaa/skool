// src/schools/entities/school.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Field, ObjectType, ID } from '@nestjs/graphql';
import { User } from 'src/users/entities/user.entity';
import { Teacher } from 'src/teacher/entities/teacher.entity';
import { Branch } from 'src/branch/entities/branch.entity';

@ObjectType()
@Entity()
export class School {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  schoolId: string;

  @Field()
  @Column()
  schoolName: string;

  @Field()
  @Column({ unique: true })
  subdomain: string;

  @Field()
  @Column({
    type: 'varchar',
    default: 'CBC'
  })
  schoolType: string;

  @Field()
  @Column({ default: true })
  isActive: boolean;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  // Relations

  @Field(() => [Branch], { nullable: true })
  @OneToMany(() => Branch, (branch: Branch) => branch.school)
  branches: Branch[];

  @OneToMany(() => Teacher, (teacher) => teacher.school)
 teachers: Teacher[];

  @Field(() => [User], { nullable: true })
  @OneToMany(() => User, (user) => user.school)
  users: User[];
}
