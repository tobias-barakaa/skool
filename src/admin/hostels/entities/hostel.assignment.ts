import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Hostel } from './hostel.entity';
import { Student } from 'src/admin/student/entities/student.entity';

@ObjectType()
@Entity('hostel_assignments')
export class HostelAssignment {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Index()
  @Column('uuid')
  tenantId: string;

  @Field(() => Hostel) 
  @ManyToOne(() => Hostel, (h) => h.hostelAssignments, { onDelete: 'CASCADE' })
  hostel: Hostel;

  @Field(() => Student) 
  @ManyToOne(() => Student, (s) => s.hostelAssignments, { onDelete: 'CASCADE' })
  student: Student;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 50, nullable: true })
  roomNumber?: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 50, nullable: true })
  bedNumber?: string;

  @Field()
  @Column({ type: 'timestamptz', default: () => 'now()' })
  assignedAt: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  vacatedAt?: Date;

  @Field()
  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status: string;

  @Field()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
