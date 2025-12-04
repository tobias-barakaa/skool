import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import { User } from 'src/admin/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

export enum MembershipRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  SCHOOL_ADMIN = 'SCHOOL_ADMIN',
  SCHOOL_MANAGER = 'SCHOOL_MANAGER',
  TEACHER = 'TEACHER',
  TREASURER = 'TREASURER',
  STAFF = 'STAFF',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
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
@Unique(['userId', 'tenantId'])
export class UserTenantMembership {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  tenantId: string;

  @ManyToOne(() => User, (user) => user.memberships, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @Field(() => User)
  user: User;

  @ManyToOne(() => Tenant, (tenant) => tenant.memberships, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @Field(() => Tenant)
  tenant: Tenant;

  @Field(() => MembershipRole)
  @Column({ type: 'enum', enum: MembershipRole })
  role: MembershipRole;

  @Field(() => MembershipStatus)
  @Column({
    type: 'enum',
    enum: MembershipStatus,
    default: MembershipStatus.ACTIVE,
  })
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

  @Column({ type: 'timestamptz', nullable: true })
deletedAt: Date;

@Column({ type: 'uuid', nullable: true })
deletedBy: string;
}

