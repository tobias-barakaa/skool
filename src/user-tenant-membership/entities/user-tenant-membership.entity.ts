import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { Tenant } from 'src/tenants/entities/tenant.entity';
import { User } from 'src/users/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';

export enum MembershipRole {
  SUPER_ADMIN = 'SUPER_ADMIN', 
  SCHOOL_ADMIN = 'SCHOOL_ADMIN', 
  SCHOOL_MANAGER = 'SCHOOL_MANAGER',
  TEACHER = 'TEACHER',
  TREASURER = 'TREASURER',
  STAFF = 'STAFF',
}

export enum MembershipStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
  EXPIRED = 'EXPIRED',
}

registerEnumType(MembershipRole, { name: 'MembershipRole' });
registerEnumType(MembershipStatus, { name: 'MembershipStatus' });

@ObjectType()
@Entity('user_tenant_memberships')
@Unique(['userId', 'tenantId']) // One membership per user per tenant
export class UserTenantMembership {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  tenantId: string;

  @ManyToOne(() => User, user => user.memberships, { nullable: false, onDelete: 'CASCADE' })
  @Field(() => User)
  user: User;

  @ManyToOne(() => Tenant, tenant => tenant.memberships, { nullable: false, onDelete: 'CASCADE' })
  @Field(() => Tenant)
  tenant: Tenant;

  @Field(() => MembershipRole)
  @Column({ type: 'enum', enum: MembershipRole })
  role: MembershipRole;

  @Field(() => MembershipStatus)
  @Column({ type: 'enum', enum: MembershipStatus, default: MembershipStatus.ACTIVE })
  status: MembershipStatus;

  @Field(() => [String], { nullable: true })
@Column({ type: 'jsonb', nullable: true })
permissions?: string[];


  @Field({ nullable: true })
  @Column({ nullable: true })
  joinedAt?: Date;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}