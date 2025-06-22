import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
  } from 'typeorm';
  import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { Student } from '../../student/entities/student.entity';
import { Class } from '../../class/entities/class.entity';
import { Teacher } from '../../teacher/entities/teacher.entity';
import { Level } from '../../level/entities/level.entities';
//   import { Student } from 'src/students/entities/student.entity';
//   import { Subject } from 'src/subjects/entities/subject.entity';
//   import { Class } from 'src/classes/entities/class.entity';
//   import { Teacher } from 'src/teachers/entities/teacher.entity';
  
  export enum AssessmentType {
    CAT = 'CAT',
    EXAM = 'EXAM',
    ASSIGNMENT = 'ASSIGNMENT',
    QUIZ = 'QUIZ',
    TEST = 'TEST',
  }
  
  registerEnumType(AssessmentType, {
    name: 'AssessmentType',
  });
  
  @ObjectType()
  @Entity()
  export class Grade {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    gradeId: string;
  
    @Field()
    @Column()
    studentId: string;
  
    @Field()
    @Column()
    subjectId: string;
  
    @Field()
    @Column()
    classId: string;

    @ManyToOne(() => Level, level => level.grades)
    level: Level;
  
    // — Assessment Info —
    @Field(() => AssessmentType)
    @Column({ type: 'enum', enum: AssessmentType })
    assessmentType: AssessmentType;
  
    @Field()
    @Column()
    assessmentName: string;
  
    @Field()
    @Column()
    term: string;
  
    @Field()
    @Column()
    academicYear: string;
  
    // — Scores —
    @Field()
    @Column('float')
    marksObtained: number;
  
    @Field()
    @Column('float')
    totalMarks: number;
  
    @Field()
    @Column('float')
    percentage: number;
  
    @Field({ nullable: true })
    @Column({ nullable: true })
    letterGrade?: string;
  
    @Field({ nullable: true })
    @Column({ type: 'float', nullable: true })
    points?: number;
  
    // — Metadata —
    @Field()
    @CreateDateColumn()
    dateRecorded: Date;
    
  
    @Field()
    @Column()
    recordedBy: string; // Teacher ID
  
    @Field()
    @Column({ default: false })
    isPublished: boolean;
  
    // — Relations —
    @Field(() => Student)
    @ManyToOne(() => Student, (student) => student.grades)
    student: Student;

   
    @Field(() => Class)
    @ManyToOne(() => Class, (cls) => cls.grades)
    class: Class;
  
    @Field(() => Teacher)
    @ManyToOne(() => Teacher, (teacher) => teacher.grades)
    teacher: Teacher;


  }
  