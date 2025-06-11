import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Branch } from "src/branch/entities/branch.entity";
import { School } from "src/school/entities/school.entity";
import { Teacher } from "src/teacher/entities/teacher.entity";
import { UserBranch } from "src/user-branch/entities/user-branch.entity";
import { Column, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

// src/users/entities/user.entity.ts
@ObjectType()
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column({ unique: true })
  @Field()
  email: string;

  @Column()
  password: string;

  @Column()
  @Field()
  username: string;

  @Column({
    type: 'varchar',
    default: 'SUPER_ADMIN',
  })
  @Field(() => String)
  userRole: string;

  @OneToMany(() => UserBranch, (userBranch) => userBranch.user)
  userBranches: UserBranch[];

  @ManyToOne(() => School, (school) => school.users)
  @Field(() => School)
  school: School;

  @ManyToOne(() => Branch, { nullable: true })
  @Field(() => Branch, { nullable: true })
  branch: Branch | null;

  @OneToOne(() => Teacher, (teacher) => teacher.user, { nullable: true })
  @Field(() => Teacher, { nullable: true })
  teacherProfile: Teacher | null;

  @OneToOne(() => Parent, (parent) => parent.user, { nullable: true })
  @Field(() => Parent, { nullable: true })
  parentProfile: Parent | null;

  @OneToOne(() => SchoolManager, (manager) => manager.user, { nullable: true })
  @Field(() => SchoolManager, { nullable: true })
  managerProfile: SchoolManager | null;

  @CreateDateColumn()
  @Field(() => Date)
  createdAt: Date;

  @UpdateDateColumn()
  @Field(() => Date)
  updatedAt: Date;
}