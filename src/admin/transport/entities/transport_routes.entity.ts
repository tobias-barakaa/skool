import { Field, ID, ObjectType, Float } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TransportAssignment } from './transport_assignment.entity';

@ObjectType()
@Entity('transport_routes')
export class TransportRoute {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Field()
  @Column()
  name: string;

  @Field(() => Float)
  @Column('float')
  fee: number;

  @Field()
  @Column('uuid')
  tenantId: string;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;


  @OneToMany(() => TransportAssignment, (assignment) => assignment.route)
  @Field(() => [TransportAssignment], { nullable: true })
  assignments?: TransportAssignment[];
}
