// src/transport/entities/transport-bus.entity.ts
import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TransportRoute } from './transport_routes.entity';
import { TransportAssignment } from './transport_assignment.entity';

@ObjectType()
@Entity('transport_buses')
export class TransportBus {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column()
  @Field()
  plateNumber: string;

  @Column()
  @Field()
  capacity: number;

  @ManyToOne(() => TransportRoute, (route) => route.buses, {
    onDelete: 'CASCADE',
  })
  @Field(() => TransportRoute)
  route: TransportRoute;

  @CreateDateColumn()
  @Field(() => Date)
  createdAt: Date;

  @UpdateDateColumn()
  @Field(() => Date)
  updatedAt: Date;

  @OneToMany(() => TransportAssignment, (assignment) => assignment.bus, {
    nullable: true,
  })
  @Field(() => [TransportAssignment], { nullable: true })
  assignments?: TransportAssignment[];
}
