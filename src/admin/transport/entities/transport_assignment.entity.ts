import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { TransportRoute } from "./transport_routes.entity";
import { Student } from "src/admin/student/entities/student.entity";
import { TransportBus } from "./transport_buses.entity";

@ObjectType()
@Entity('transport_assignments')
export class TransportAssignment {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @ManyToOne(() => TransportRoute, { eager: true, onDelete: 'CASCADE' })
  @Field(() => TransportRoute)
  route: TransportRoute;

  @ManyToOne(() => Student, (s) => s.transportAssignments, { eager: true, onDelete: 'CASCADE' })
  @Field(() => Student)
  student: Student;

  @ManyToOne(() => TransportBus, (bus) => bus.assignments, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bus_id' })
  @Field(() => TransportBus)
  bus: TransportBus;

  @Field()
  @Column({ nullable: true })
  pickupPoint?: string;

  @Field()
  @Column('uuid')
  tenantId: string;

  @Field()
  @Column({ default: true })
  isActive: boolean;

  @Field(() => Date)
  @CreateDateColumn()
  assignedAt: Date;
}
