import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { TransportRoute } from './transport_routes.entity';
import { Student } from 'src/admin/student/entities/student.entity';

@ObjectType()
@Entity('transport_assignments')
export class TransportAssignment {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Index()
  @Column('uuid')
  @Field()
  tenantId: string;

  @Field(() => TransportRoute, { nullable: true })
@ManyToOne(() => TransportRoute, (r) => r.assignments, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'route_id' })
route?: TransportRoute;


  @Column('uuid')
  @Field(() => ID)
  routeId: string;

  @ManyToOne(() => Student, (s) => s.transportAssignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  @Field(() => Student, { nullable: true }) 
  student?: Student; 

  @Column('uuid')
  @Field(() => ID)
  studentId: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  pickupPoint?: string;

  @Field()
  @Column({ type: 'timestamptz', default: () => 'now()' })
  assignedAt: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  vacatedAt?: Date;

  @Field()
  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status: 'ACTIVE' | 'INACTIVE';

  @Field(() => Date)
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}