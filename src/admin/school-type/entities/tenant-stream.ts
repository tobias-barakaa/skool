import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import { GradeLevel } from 'src/admin/level/entities/grade-level.entity';
import { TenantGradeLevel } from './tenant-grade-level';
import { Stream } from 'src/admin/streams/entities/streams.entity';

@ObjectType()
@Entity()
export class TenantStream {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn()
  tenant: Tenant;

  @ManyToOne(() => TenantGradeLevel, { onDelete: 'CASCADE' })
  @JoinColumn()
  tenantGradeLevel: TenantGradeLevel;

  @ManyToOne(() => Stream, { eager: true })
  @JoinColumn()
  stream: Stream;

  @Field(() => Boolean)
  @Column({ default: true })
  isActive: boolean;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;
}
