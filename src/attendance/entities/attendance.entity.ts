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
import { Subject } from '../../subject/entities/subject.entity';
import { Teacher } from '../../teacher/entities/teacher.entity';
//   import { Student } from 'src/students/entities/student.entity';
//   import { Class } from 'src/classes/entities/class.entity';
//   import { Subject } from 'src/subjects/entities/subject.entity';
//   import { Teacher } from 'src/teachers/entities/teacher.entity';
  
  export enum AttendanceStatus {
    PRESENT = 'PRESENT',
    ABSENT = 'ABSENT',
    LATE = 'LATE',
    EXCUSED = 'EXCUSED',
  }
  
  registerEnumType(AttendanceStatus, {
    name: 'AttendanceStatus',
  });
  
  @ObjectType()
  @Entity()
  export class Attendance {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    attendanceId: string;
  
    @Field()
    @Column()
    studentId: string;
  
    @Field({ nullable: true })
    @Column({ nullable: true })
    classId?: string;
  
    @Field({ nullable: true })
    @Column({ nullable: true })
    subjectId?: string;
  
    @Field()
    @Column({ type: 'date' })
    date: Date;
  
    @Field(() => AttendanceStatus)
    @Column({ type: 'enum', enum: AttendanceStatus })
    status: AttendanceStatus;
  
    @Field({ nullable: true })
    @Column({ type: 'text', nullable: true })
    remarks?: string;
  
    // Time tracking
    @Field({ nullable: true })
    @Column({ type: 'timestamp', nullable: true })
    timeIn?: Date;
  
    @Field({ nullable: true })
    @Column({ type: 'timestamp', nullable: true })
    timeOut?: Date;
  
    // Relations
    @Field(() => Student)
    @ManyToOne(() => Student, (student) => student.attendance)
    student: Student;
  
    @Field(() => Class, { nullable: true })
    @ManyToOne(() => Class, (cls) => cls.attendance, { nullable: true })
    class?: Class;
  
    @Field(() => Subject, { nullable: true })
    @ManyToOne(() => Subject, (subject) => subject.attendance, { nullable: true })
    subject?: Subject;
  
    @Field(() => Teacher)
    @ManyToOne(() => Teacher, (teacher) => teacher.attendance)
    markedBy: Teacher;
  }
  