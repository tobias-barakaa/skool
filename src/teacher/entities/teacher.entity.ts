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
  } from 'typeorm';
  import { ObjectType, Field, ID } from '@nestjs/graphql';
  import { User } from 'src/users/entities/user.entity';
  
import { School } from 'src/school/entities/school.entity';
import { Branch } from 'src/branch/entities/branch.entity';
  
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
  
    @Field()
    @Column({
    type: 'text',
    array: true,
    default: []
    })
    classes: string[];
  
    @Field()
    @Column({
    type: 'varchar',
    default: 'Math'
    })
    subjects: string[];
  
    @Field(() => [Branch])
    @ManyToMany(() => Branch, (branch: Branch) => branch.teachers)
    @JoinTable()
    branches: Branch[];
  }
  