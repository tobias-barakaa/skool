// attendance.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { User } from 'src/admin/users/entities/user.entity';
import { Student } from 'src/admin/student/entities/student.entity';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  SUSPENDED = 'suspended'
}

registerEnumType(AttendanceStatus, {
  name: 'AttendanceStatus',
});

@Entity()
@ObjectType()
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column()
  @Field()
  studentId: string;

  @Column()
  @Field()
  teacherId: string;

  @Column()
  @Field()
  tenantId: string;

  @Column()
  @Field()
  gradeId: string;

  @Column()
  @Field()
  date: string;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
  })
  @Field(() => AttendanceStatus)
  status: AttendanceStatus;

  @CreateDateColumn()
  @Field()
  createdAt: Date;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'studentId' })
  @Field(() => Student)
  student: Student;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'teacherId' })
  @Field(() => User)
  teacher: User;
}
