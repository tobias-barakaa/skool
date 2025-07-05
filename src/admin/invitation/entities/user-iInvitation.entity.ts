import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import { CreateTeacherInvitationDto } from 'src/admin/teacher/dtos/create-teacher-invitation.dto';
import { User } from 'src/admin/users/entities/user.entity';

export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  REVOKED = 'REVOKED',
  DECLINED = 'DECLINED',
  FAILED = 'FAILED',
  ERROR = 'ERROR',
  INVALID = 'INVALID',
  DUPLICATE = 'DUPLICATE',
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  BLOCKED = 'BLOCKED',
}


export enum InvitationType {
    TEACHER = 'TEACHER',
    SCHOOL_MANAGER = 'SCHOOL_MANAGER',
    PARENT = 'PARENT'
  }

registerEnumType(InvitationType, { name: 'InvitationType' });

registerEnumType(InvitationStatus, { name: 'InvitationStatus' });

@ObjectType()
@Entity('user_invitations')
export class UserInvitation {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  email: string;

  @Field()
  @Column({ type: 'varchar' }) // or just @Column() by default
  role: string;

  @Field()
  @Column({ unique: true })
  token: string;

  @Field(() => InvitationStatus)
  @Column({
    type: 'enum',
    enum: InvitationStatus,
    default: InvitationStatus.PENDING,
  })
  status: InvitationStatus;

  @Field()
  @Column()
  expiresAt: Date;

  @Column()
  tenantId: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.invitations, {
    onDelete: 'CASCADE',
  })
  @Field(() => Tenant)
  tenant: Tenant;

  @Column()
  type: string;

  @Column({ type: 'json', nullable: true })
  // userData: Partial<CreateTeacherInvitationDto>;
  userData: Record<string, any>;
  
  @Column({ nullable: true })
  invitedById?: string;

  @ManyToOne(() => User, (user) => user.sentInvitations, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @Field(() => User, { nullable: true })
  invitedBy?: User;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
