import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { TransportBus } from "./transport_buses.entity";

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
  @Column()
  startLocation: string;

  @Field()
  @Column()
  endLocation: string;

  @Field()
  @Column('float')
  fee: number;

  @Field()
  @Column('uuid')
  tenantId: string;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => TransportBus, (bus) => bus.route)
  @Field(() => [TransportBus], { nullable: true })
  buses?: TransportBus[];
}
