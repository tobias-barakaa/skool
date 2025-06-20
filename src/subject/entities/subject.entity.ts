import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
  } from 'typeorm';
  import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { School } from '../../school/entities/school.entity';
import { Attendance } from '../../attendance/entities/attendance.entity';
import { Grade } from '../../grade/entities/grade.entity';
import { SubjectType } from '../enums/subject.type.enum';
import { SubjectCategory } from '../enums/subject.categories.enum';
import { Level } from '../../level/entities/level.entities';
  
  
  @ObjectType()
  @Entity()
  export class Subject {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    subjectId: string;
  
    // @Field()
    // @Column({ unique: true })
    // subjectCode: string;
  
    @Field()
    @Column()
    subjectName: string;
  
    @Field()
    @Column()
    shortName: string;
  
    // Classification
    @Field(() => SubjectCategory)
    @Column({ type: 'enum', enum: SubjectCategory })
    category: SubjectCategory;
  
    @Field()
    @Column()
    department: string;
  
    @Field(() => SubjectType)
    @Column({ type: 'enum', enum: SubjectType })
    subjectType: SubjectType;
  
    // Grade Levels Offered
    @Field(() => [String])
    @Column("text", { array: true })
    gradeLevel: string[];
  
    @Field()
    @Column({ default: false })
    isCompulsory: boolean;
  
    // Academic Configuration
    @Field()
    @Column('int')
    totalMarks: number;
  
    @Field()
    @Column('int')
    passingMarks: number;
  
    @Field()
    @Column('int')
    creditHours: number;
  
    // @Field({ nullable: true })
    // @Column('int', { nullable: true })
    // practicalHours?: number;
  
    // Curriculum
    @Field(() => [String])
    @Column("text", { array: true })
    curriculum: string[];
  
    @Field({ nullable: true })
    @Column({ nullable: true })
    syllabus?: string;
  
    @Field(() => [String])
    @Column("text", { array: true })
    learningOutcomes: string[];
  
    // Resources
    @Field(() => [String])
    @Column("text", { array: true })
    textbooks: string[];
  
    @Field(() => [String])
    @Column("text", { array: true })
    materials: string[];
  
    // Prerequisites
    @Field(() => [String])
    @Column("text", { array: true })
    prerequisiteSubjects: string[];
  
    // School reference
    @Field()
    @Column()
    schoolId: string;

    @ManyToOne(() => Level, level => level.subjects)
    level: Level;
  
    // Status flags
    @Field()
    @Column({ default: true })
    isActive: boolean;
  
    @Field()
    @Column({ default: true })
    isOffered: boolean;
  
    // Metadata
    @Field()
    @CreateDateColumn()
    createdAt: Date;
  
    @Field()
    @UpdateDateColumn()
    updatedAt: Date;
  
    @Field()
    @Column()
    createdBy: string;
  
    // Relations
    @Field(() => School)
    @ManyToOne(() => School, (school) => school.subject)
    school: School;

    @Field(() => [Attendance])
    @OneToMany(() => Attendance, (attendance) => attendance.subject)
    attendance: Attendance[];

  
    @Field(() => [String], { nullable: true })
@Column({
    type: 'text',
    array: true,
    default: [],
})
classes: string[];

  
   

    @Field(() => [String])
@Column({
  type: 'text',
  array: true,
  default: [],
})
teachers: string[];

  
    @Field(() => [String], { nullable: true })
@Column({
    type: 'text',
    array: true,
    default: [],
})
students: string[];

  
    @Field(() => [Grade], { nullable: true })
    @OneToMany(() => Grade, (grade) => grade.subject)
    grades: Grade[];
  

    @Field(() => [String], { nullable: true })
    @Column({
        type: 'text',
        array: true,
        default: [],
    })
    timetableSlots: string[];

    @Column()
    name: string;

  
    @Field(() => [String],{ nullable: true })
    @Column({
        type: 'text',
        array: true,
        default: []
    })
    examSchedules: string[];
  }

  