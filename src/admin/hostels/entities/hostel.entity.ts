import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  UpdateDateColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { HostelAssignment } from './hostel.assignment';

@ObjectType()
@Entity('hostels')
export class Hostel {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Index()
  @Column('uuid')
  tenantId: string;

  @ManyToOne(() => Tenant, (t) => t.hostels, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Field()
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Field(() => Int)
  @Column('int', { default: 0 })
  capacity: number;

  @Field(() => Float)
  @Column('numeric', { precision: 12, scale: 2, default: 0 })
  feeAmount: number;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 20, nullable: true })
  genderConstraint?: string;

  @Field()
  @Column({ default: true })
  isActive: boolean;


  @Field(() => [HostelAssignment], { nullable: true })
  @OneToMany(() => HostelAssignment, (a) => a.hostel, { nullable: true })
  hostelAssignments?: HostelAssignment[];

  @Field()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;


  @Field(() => Date) 
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
