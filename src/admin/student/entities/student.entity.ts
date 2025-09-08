import { Field, ID, ObjectType } from '@nestjs/graphql';
import { HostelAssignment } from 'src/admin/hostels/entities/hostel.assignment';
import { Scholarship } from 'src/admin/scholarships/entities/scholarship.entity';
import { StudentScholarship } from 'src/admin/scholarships/entities/scholarship_assignments.entity';
import { TenantGradeLevel } from 'src/admin/school-type/entities/tenant-grade-level';
import { Stream } from 'src/admin/streams/entities/streams.entity';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import { TransportAssignment } from 'src/admin/transport/entities/transport_assignment.entity';
import { TransportRoute } from 'src/admin/transport/entities/transport_routes.entity';
import { User } from 'src/admin/users/entities/user.entity';
import { AssessmentMark } from 'src/teacher/marksheet/entities/assessment_marks-entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@ObjectType()
@Entity('students')
export class Student {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column()
  @Field()
  admission_number: string;

  @Column('uuid')
  @Field(() => ID)
  user_id: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  @Field(() => User)
  user: User;

  @Column()
  @Field()
  phone: string;

  @Column()
  @Field()
  gender: string;

  @ManyToOne(() => TenantGradeLevel, {
    eager: true,
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'grade_level_id' })
  @Field(() => TenantGradeLevel)
  grade: TenantGradeLevel;

  @Field()
  @Column({ default: 0 })
  feesOwed: number;

  @Field()
  @Column({ default: 0 })
  totalFeesPaid: number;

  @CreateDateColumn()
  @Field(() => Date)
  createdAt: Date;

  @Field()
  @Column({ default: true })
  isActive: boolean;

  @UpdateDateColumn()
  @Field(() => Date)
  updatedAt: Date;

  @ManyToOne(() => Stream, (stream) => stream.students, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @Field(() => Stream, { nullable: true })
  stream?: Stream;

  @OneToMany(() => AssessmentMark, (mark) => mark.student)
  marks: AssessmentMark[];

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  @Field(() => Tenant)
  tenant: Tenant;

  @Column('uuid')
  @Field(() => ID)
  tenant_id: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', nullable: true, default: 'day' })
  schoolType?: string;

  @OneToMany(() => HostelAssignment, (assignment) => assignment.student, { nullable: true })
  @Field(() => [HostelAssignment], { nullable: true }) 
  hostelAssignments?: HostelAssignment[];


  
  @ManyToOne(() => Scholarship, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'scholarship_id' })
  @Field(() => Scholarship, { nullable: true })
  scholarships?: Scholarship;

  @Column({ type: 'uuid', nullable: true })
  scholarship_id?: string;

  @OneToMany(() => StudentScholarship, (ss) => ss.scholarship)
  @Field(() => [StudentScholarship], { nullable: true })
  studentScholarships?: StudentScholarship[];

  @OneToMany(() => TransportAssignment, (ta) => ta.student)
  @Field(() => [TransportAssignment], { nullable: true })
  transportAssignments?: TransportAssignment[];
}


