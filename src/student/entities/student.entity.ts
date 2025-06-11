import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    ManyToMany,
    JoinTable,
    OneToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
  } from 'typeorm';
  import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
  import { User } from 'src/users/entities/user.entity';
//   import { StudentSubject } from 'src/student-subjects/entities/student-subject.entity';
  import { Grade } from 'src/grades/entities/grade.entity';
  import { Attendance } from 'src/attendance/entities/attendance.entity';
  import { DisciplinaryRecord } from 'src/discipline/entities/disciplinary.entity';
  import { MedicalRecord } from 'src/medical/entities/medical.entity';
  import { FeePayment } from 'src/fees/entities/fee-payment.entity';
  import { Invoice } from 'src/fees/entities/invoice.entity';
import { Gender } from '../enums/student.gender.enum';
import { AcademicStatus } from '../enums/student.academic.status.enum';
import { School } from 'src/school/entities/school.entity';
import { Branch } from 'src/branch/entities/branch.entity';
import { Class } from 'src/class/entities/class.entity';
  
  @ObjectType()
  @Entity()
  export class Student {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    studentId: string;
  
    @Field()
    @Column({ unique: true })
    studentNumber: string;
  
    @Field()
    @Column({ unique: true })
    admissionNumber: string;
  
    @Field()
    @Column()
    firstName: string;
  
    @Field()
    @Column()
    lastName: string;
  
    @Field({ nullable: true })
    @Column({ nullable: true })
    middleName?: string;
  
    @Field()
    @Column()
    dateOfBirth: Date;
  
    @Field(() => Gender)
    @Column({ type: 'enum', enum: Gender })
    gender: Gender;
  
    @Field()
    @Column()
    nationality: string;
  
    @Field({ nullable: true })
    @Column({ nullable: true })
    religion?: string;
  
    @Field({ nullable: true })
    @Column({ nullable: true })
    bloodGroup?: string;
  
    @Field(() => [String], { nullable: true })
    @Column('text', { array: true, nullable: true })
    medicalConditions?: string[];
  
    @Field(() => [String], { nullable: true })
    @Column('text', { array: true, nullable: true })
    allergies?: string[];
  
    @Field()
    @Column()
    address: string;
  
    @Field({ nullable: true })
    @Column({ nullable: true })
    phoneNumber?: string;
  
    @Field(() => [String]) // Consider a separate entity for EmergencyContact
    @Column('jsonb', { default: [] })
    emergencyContact: any[];
  
    @Field()
    @Column()
    currentGrade: string;
  
    @Field({ nullable: true })
    @Column({ nullable: true })
    stream?: string;
  
    @Field()
    @Column()
    admissionDate: Date;
  
    @Field({ nullable: true })
    @Column({ nullable: true })
    graduationDate?: Date;
  
    @Field(() => AcademicStatus)
    @Column({ type: 'enum', enum: AcademicStatus })
    academicStatus: AcademicStatus;
  
    @Field()
    @Column()
    schoolId: string;
  
    @Field()
    @Column()
    branchId: string;
  
    @Field({ nullable: true })
    @Column({ nullable: true })
    classId?: string;
  
    @Field()
    @Column()
    primaryParentId: string;
  
    @Field({ nullable: true })
    @Column({ nullable: true })
    secondaryParentId?: string;
  
    @Field({ nullable: true })
    @Column({ nullable: true })
    guardianId?: string;
  
    @Field({ nullable: true })
    @Column({ nullable: true })
    feeCategory?: string;
  
    @Field({ nullable: true })
    @Column({ nullable: true })
    scholarshipType?: string;
  
    @Field()
    @Column({ default: 0 })
    feesOwed: number;
  
    @Field()
    @Column({ default: 0 })
    totalFeesPaid: number;
  
    @Field({ nullable: true })
    @Column({ nullable: true })
    overallGrade?: string;
  
    @Field({ nullable: true })
    @Column({ nullable: true, type: 'float' })
    gpa?: number;
  
    @Field({ nullable: true })
    @Column({ nullable: true })
    rank?: number;
  
    @Field()
    @Column({ default: true })
    isActive: boolean;
  
    @Field()
    @Column({ default: false })
    hasLeft: boolean;
  
    @Field({ nullable: true })
    @Column({ nullable: true })
    leftDate?: Date;
  
    @Field({ nullable: true })
    @Column({ nullable: true })
    leftReason?: string;
  
    @Field()
    @CreateDateColumn()
    createdAt: Date;
  
    @Field()
    @UpdateDateColumn()
    updatedAt: Date;
  
    @Field()
    @Column()
    createdBy: string;
  
    @Field(() => School)
    @ManyToOne(() => School, (school) => school.students)
    school: School;

    @Field(() => [Class])
    @OneToMany(() => Class, (cls) => cls.classMonitor)
    monitorOf: Class[];
  
    @Field(() => Branch)
    @ManyToOne(() => Branch, (branch) => branch.students)
    branch: Branch;
  
    @Field(() => Class, { nullable: true })
    @ManyToOne(() => Class, (cls) => cls.students, { nullable: true })
    currentClass?: Class;
  
    @Field(() => Parent)
    @ManyToOne(() => Parent, (parent) => parent.children)
    primaryParent: Parent;
  
    @Field(() => Parent, { nullable: true })
    @ManyToOne(() => Parent, { nullable: true })
    secondaryParent?: Parent;
  
    @Field(() => Guardian, { nullable: true })
    @ManyToOne(() => Guardian, (guardian) => guardian.students, { nullable: true })
    guardian?: Guardian;
  
    @Field(() => User, { nullable: true })
    @OneToOne(() => User, { nullable: true })
    @JoinColumn()
    user?: User;
  
    @Field(() => [StudentSubject])
    @OneToMany(() => StudentSubject, (ss) => ss.student)
    subjects: StudentSubject[];
  
    @Field(() => [Grade])
    @OneToMany(() => Grade, (grade) => grade.student)
    grades: Grade[];
  
    @Field(() => [Attendance])
    @OneToMany(() => Attendance, (attendance) => attendance.student)
    attendance: Attendance[];
  
    @Field(() => [DisciplinaryRecord])
    @OneToMany(() => DisciplinaryRecord, (record) => record.student)
    disciplinaryRecords: DisciplinaryRecord[];
  
    @Field(() => [MedicalRecord])
    @OneToMany(() => MedicalRecord, (record) => record.student)
    medicalRecords: MedicalRecord[];
  
    @Field(() => [FeePayment])
    @OneToMany(() => FeePayment, (fp) => fp.student)
    feePayments: FeePayment[];
  
    @Field(() => [Invoice])
    @OneToMany(() => Invoice, (inv) => inv.student)
    invoices: Invoice[];
  }
  
  registerEnumType(Gender, {
    name: 'Gender',
  });
  
  registerEnumType(AcademicStatus, {
    name: 'AcademicStatus',
  });