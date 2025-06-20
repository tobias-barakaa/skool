// src/teachers/entities/teacher.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToOne,
    JoinColumn,
    ManyToMany,
    JoinTable,
    OneToMany,
  } from 'typeorm';
  import { ObjectType, Field, ID } from '@nestjs/graphql';
  import { User } from '../../users/entities/user.entity';
  
import { School } from '../../school/entities/school.entity';
import { Branch } from '../../branch/entities/branch.entity';
import { Class } from '../../class/entities/class.entity';
import { Grade } from '../../grade/entities/grade.entity';
import { Attendance } from '../../attendance/entities/attendance.entity';
import { Organization } from '../../organizations/entities/organizations-entity';
  
  @ObjectType()
  @Entity()
  export class Teacher {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    teacherId: string;
  
    @Field()
    @Column({ unique: true })
    employeeId: string;
  
    @Field()
    @Column()
    firstName: string;
  
    @Field()
    @Column()
    lastName: string;
  
    @Field({ nullable: true })
    @Column({ nullable: true })
    phoneNumber?: string;
  
    @Field({ nullable: true })
    @Column({ type: 'date', nullable: true })
    dateOfBirth?: Date;
  
    @Field()
    @Column({ type: 'date' })
    hireDate: Date;
  
    @Field({ nullable: true })
    @Column({ type: 'float', nullable: true })
    salary?: number;
  
    @Field({ nullable: true })
    @Column({ nullable: true })
    department?: string;
  
    @Field(() => [String])
    @Column({ type: 'text', array: true, default: [] })
    specialization: string[];
  
    @Field(() => [String])
    @Column({ type: 'text', array: true, default: [] })
    qualifications: string[];
  
    @Field()
    @Column({ default: true })
    isActive: boolean;
  
    @Field()
    @Column()
    schoolId: string;
  
    // 🔗 Relations
  
    @Field(() => School)
    @ManyToOne(() => School, (school) => school.teachers, { onDelete: 'CASCADE' })
    school: School;
  
    @Field(() => User)
    @OneToOne(() => User, { cascade: true })
    @JoinColumn()
    user: User;
  
    @Field(() => [String])
    @Column({
    type: 'text',
    array: true,
    default: []
    })
    classes: string[];
  
    @Field(() => [String])
    @Column({
    type: 'varchar',
    default: 'Math'
    })
    subjects: string[];
  
    @Field(() => [Branch])
    @ManyToMany(() => Branch, (branch: Branch) => branch.teachers)
    @JoinTable()
    branches: Branch[];

    @Field(() => [Class])
    @OneToMany(() => Class, (cls) => cls.classTeacher)
    primaryClasses: Class[];

    @Field(() => [Grade])
    @OneToMany(() => Grade, (grade) => grade.teacher)
    grades: Grade[];


    @Field(() => [Organization])
    @OneToMany(() => Organization, (organization) => organization.teachers)
    organization: Organization[];

      // One teacher can assist multiple classes
     @Field(() => [Class])
    @OneToMany(() => Class, (cls) => cls.assistantTeacher)
     assistantClasses: Class[];

     @Field(() => [Attendance])
    @OneToMany(() => Attendance, (attendance) => attendance.markedBy)
    attendance: Attendance[];

    
 

  }
  