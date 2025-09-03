import { Field, ID, ObjectType, Float } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TransportAssignment } from '../entities/transport_assignment.entity';

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
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => TransportAssignment, (a) => a.route, { nullable: true })
  @Field(() => [TransportAssignment], { nullable: true })
  assignments?: TransportAssignment[];
}
