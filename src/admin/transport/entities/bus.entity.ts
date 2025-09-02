// src/admin/transport/entities/bus.entity.ts
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { TransportRoute } from './transport_routes.entity';
import { TransportAssignment } from './transport_assignment.entity';

@ObjectType()
@Entity('buses')
export class Bus {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column()
  @Field()
  plateNumber: string;

  @Column()
  @Field()
  driverName: string;

  @Column()
  @Field()
  driverPhone: string;

  @Column('int')
  @Field(() => Int)
  capacity: number;

  @ManyToOne(() => TransportRoute, (route) => route.buses, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @Field(() => TransportRoute)
  route: TransportRoute;

  @Column('uuid')
  @Field(() => ID)
  routeId: string;

  @OneToMany(() => TransportAssignment, (assignment) => assignment.bus)
  @Field(() => [TransportAssignment], { nullable: true })
  busAssignments?: TransportAssignment[];
}
