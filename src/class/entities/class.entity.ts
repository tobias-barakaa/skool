import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
    JoinColumn,
  } from 'typeorm';
  import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
  
//   import { School } from 'src/schools/entities/school.entity';
//   import { Branch } from 'src/branches/entities/branch.entity';
//   import { Teacher } from 'src/teachers/entities/teacher.entity';
//   import { Student } from 'src/students/entities/student.entity';
//   import { ClassSubject } from 'src/class-subjects/entities/class-subject.entity';
//   import { TeacherClass } from 'src/teacher-classes/entities/teacher-class.entity';
//   import { TimetableSlot } from 'src/timetable/entities/timetable-slot.entity';
  import { Attendance } from '../../attendance/entities/attendance.entity';
import { School } from '../../school/entities/school.entity';
import { Grade } from '../../grade/entities/grade.entity';
import { Teacher } from '../../teacher/entities/teacher.entity';
import { Student } from '../../student/entities/student.entity';
//   import { Exam } from 'src/exams/entities/exam.entity';
//   import { Assignment } from 'src/assignments/entities/assignment.entity';
//   import { ClassEvent } from 'src/events/entities/class-event.entity';
//   import { BreakTime } from 'src/classes/entities/breaktime.entity';
  
  export enum ClassType {
    REGULAR = 'REGULAR',
    SPECIAL = 'SPECIAL',
    BOARDING = 'BOARDING',
  }
  
  registerEnumType(ClassType, { name: 'ClassType' });
  
  @ObjectType()
  @Entity()
  export class Class {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    classId: string;
  
    @Field()
    @Column()
    className: string;
  
    @Field()
    @Column()
    classCode: string;
  
    // Hierarchy
    @Field()
    @Column()
    grade: string;
  
    @Field()
    @Column()
    stream: string;
  
    @Field({ nullable: true })
    @Column({ nullable: true })
    section?: string;
  
    // Academic Info
    @Field()
    @Column()
    academicYear: string;
  
    @Field()
    @Column()
    term: string;
  
    @Field()
    @Column('int')
    maxStudents: number;
  
    @Field()
    @Column('int', { default: 0 })
    currentStudents: number;
  
    // Hierarchy
    @Field()
    @Column()
    schoolId: string;
  
    @Field()
    @Column()
    branchId: string;
  
    // Class Leadership
    @Field()
    @Column()
    classTeacherId: string;
  
    @Field({ nullable: true })
    @Column({ nullable: true })
    assistantTeacherId?: string;
  
    @Field({ nullable: true })
    @Column({ nullable: true })
    classMonitorId?: string;
  
    // Physical Info
    @Field({ nullable: true })
    @Column({ nullable: true })
    classroom?: string;
  
    @Field({ nullable: true })
    @Column({ nullable: true })
    building?: string;
  
    @Field({ nullable: true })
    @Column('int', { nullable: true })
    floor?: number;
  
    // Schedule Info
    @Field()
    @Column()
    schoolDayStart: string;
  
    @Field()
    @Column()
    schoolDayEnd: string;
  
    @Field(() => [String], { nullable: true })
    @Column({
        type: 'jsonb',
        default: [],
        nullable: true,
    })
    breakTimes: string[];
  
    // Config
    @Field(() => ClassType)
    @Column({ type: 'enum', enum: ClassType })
    classType: ClassType;
  
    @Field()
    @Column({ default: false })
    specialNeeds: boolean;
  
    // Status
    @Field()
    @Column({ default: true })
    isActive: boolean;
  
    @Field()
    @Column({ default: false })
    isPromoted: boolean;
  
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
    @Field(() => [School])
    @ManyToOne(() => School, (school) => school.classes)
    school: School;
  

    @Field(() => [Grade])
    @OneToMany(() => Grade, (grade) => grade.class)
    grades: Grade[];

  
   
  
    @Field(() => [String], { nullable: true })
@Column({ type: 'text', array: true, default: [] })
subjects: string[];

  
    @Field(() => [String], { nullable: true })
    @Column({ nullable: true, type: 'text', array: true, default: [] })
    teachers: string[];

    // teachers: TeacherClass[];
  
    @Field(() => [String], { nullable: true })
    @Column({ type: 'jsonb', default: [] })
    timetable: string[];
  
    @Field(() => [Attendance])
    @OneToMany(() => Attendance, (a) => a.class)
    attendance: Attendance[];
  
    @Field(() => [String], { nullable: true })
    @Column({ type: 'text', array: true, default: [] })
    // exams: Exam[];
    exams: string[];

  
    @Field(() => [String], { nullable: true })
    @Column({  type: 'text', array: true, default: [] })
    assignments: string[];
  
    @Field(() => [String], { nullable: true })
    @Column({ type: 'text', array: true, default: [] })
    classEvents: string[];
  }
  
