import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Branch } from "../../branch/entities/branch.entity";
import { Organization } from "../../organizations/entities/organizations-entity";
import { Parent } from "../../parent/entities/parent.entity";
import { School } from "../../school/entities/school.entity";
import { SchoolManager } from "../../schoolmanager/entities/school-manager.entity";
import { Teacher } from "../../teacher/entities/teacher.entity";
import { UserBranch } from "../../user-branch/entities/user-branch.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

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

  @Field()
  @Column()
  password: string;

  @Field()
  @Column()
  name: string;

  @Column({
    type: 'varchar',
    default: 'SUPER_ADMIN',
  })
  @Field(() => String)
  userRole: string;


  @Field()
  @Column({ nullable: true }) 
  organizationId: string;

  @ManyToOne(() => Organization, org => org.users)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;


 
  @Field(() => [UserBranch], { nullable: true })
  @OneToMany(() => UserBranch, (userBranch) => userBranch.user)
  userBranches: UserBranch[];

  @Field(() => School, { nullable: true })
  @ManyToOne(() => School, (school) => school.users)
  @Field(() => School)
  school: School;

  @Column({ type: 'text', nullable: true }) 
  @Field({ nullable: true })               
  schoolUrl?: string;

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

  
  // @ManyToOne(() => School, (school) => school.users, {
  //   nullable: true,
  //   onDelete: 'SET NULL',
  // })
  // school: School;

  @CreateDateColumn()
  @Field(() => Date)
  createdAt: Date;

  @UpdateDateColumn()
  @Field(() => Date)
  updatedAt: Date;
}