import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Field, ObjectType, ID, registerEnumType } from '@nestjs/graphql';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import { MembershipRole } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';

// export enum StaffRole {
//   ADMINISTRATOR = 'ADMINISTRATOR',
//   ACCOUNTANT = 'ACCOUNTANT',
//   LIBRARIAN = 'LIBRARIAN',
//   NURSE = 'NURSE',
//   SECURITY = 'SECURITY',
//   JANITOR = 'JANITOR',
//   RECEPTIONIST = 'RECEPTIONIST',
//   IT_SUPPORT = 'IT_SUPPORT',
//   COUNSELOR = 'COUNSELOR',
//   COOK = 'COOK',
//   DRIVER = 'DRIVER',
//   MAINTENANCE = 'MAINTENANCE',
//   OTHER = 'OTHER',
// }

export enum StaffStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
}

// registerEnumType(StaffRole, {
//   name: 'StaffRole',
// });

registerEnumType(StaffStatus, {
  name: 'StaffStatus',
});


@ObjectType()
@Entity('staff')
export class Staff {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ length: 100 })
  fullName: string;

  @Field()
  @Column({ length: 50 })
  firstName: string;

  @Field()
  @Column({ length: 50 })
  lastName: string;

  @Field()
  @Column()
  email: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  phoneNumber?: string;

  @Field()
  @Column()
  gender: string;

  @Field(() => MembershipRole)
  @Column({ type: 'enum', enum: MembershipRole, nullable: true })
  role: MembershipRole;

  @Field(() => StaffStatus)
  @Column({
    type: 'enum',
    enum: StaffStatus,
    default: StaffStatus.ACTIVE,
  })
  status: StaffStatus;

  @Field({ nullable: true })
  @Column({ nullable: true })
  employeeId?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  nationalId?: string;



  @Field({ nullable: true })
  @Column({ type: 'date', nullable: true })
dateOfBirth?: string;   

@Field({ nullable: true })
@Column({ type: 'date', nullable: true })
dateOfJoining?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  emergencyContact?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  emergencyContactPhone?: string;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salary?: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  bankAccount?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  bankName?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  department?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  supervisor?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  jobDescription?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  qualifications?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  workExperience?: string;

  @Field()
  @Column({ type: 'text', nullable: true })
  roleType: string;

  @Field()
  @Column({ default: false })
  isActive: boolean;

  @Field()
  @Column({ default: false })
  hasCompletedProfile: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true })
  userId?: string;

  @Field()
  @Column()
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
