import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@ObjectType()
@Entity('hostels')
export class Hostel {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  tenantId: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.hostels, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Field()
  @Column()
  name: string;

  @Field(() => Int)
  @Column('int')
  capacity: number;

  @Field(() => Float)
  @Column('decimal', { precision: 12, scale: 2 })
  feeAmount: number;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
