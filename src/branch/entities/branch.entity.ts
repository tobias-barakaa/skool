import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    ManyToMany,
    JoinTable,
  } from 'typeorm';
  import { Field, ObjectType, ID } from '@nestjs/graphql';
import { School } from '../../school/entities/school.entity';
import { UserBranch } from '../../user-branch/entities/user-branch.entity';
import { Teacher } from '../../teacher/entities/teacher.entity';
import { Class } from '../../class/entities/class.entity';
import { Student } from '../../student/entities/student.entity';
  
  @ObjectType()
  @Entity()
  export class Branch {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    branchId: string;
  
    @Field()
    @Column()
    branchName: string;
  
    @Field()
    @Column()
    branchCode: string;
  
    @Field()
    @Column()
    address: string;
  
    @Field()
    @Column()
    schoolId: string;
  
    @Field()
    @Column({ default: true })
    isActive: boolean;
  
    // Relations
  
    @Field(() => School)
    @ManyToOne(() => School, (school: School) => school.branches, { onDelete: 'CASCADE' })
    school: School;
  
    @Field(() => [UserBranch], { nullable: true })
    @OneToMany(() => UserBranch, (userBranch: UserBranch) => userBranch.branch)
    userBranches: UserBranch[];

    @Field(() => [Teacher])
    @ManyToMany(() => Teacher, (teacher) => teacher.branches)
   teachers: Teacher[];

   @Field(() => [Class])
   @OneToMany(() => Class, (cls) => cls.branch)
   classes: Class[];

   @Field(() => [Student])
   @OneToMany(() => Student, (student) => student.branch)
   students: Student[];

  }
  