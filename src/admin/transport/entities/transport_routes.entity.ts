import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
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

  @Field()
  @Column({ type: 'float' })
  fee: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @Field({ nullable: true })
  billingCycleLabel?: string;

  @Field()
  @Column('uuid')
  tenantId: string;

  @Field(() => Date)
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  
  @OneToMany(() => TransportAssignment, (assignment) => assignment.route)
  @Field(() => [TransportAssignment], { nullable: true })
  assignments?: TransportAssignment[];
}


