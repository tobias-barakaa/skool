import { ObjectType, Field, ID } from '@nestjs/graphql';
import { UserTenantMembership } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@ObjectType()
@Entity('teacher_profiles')
export class TeacherProfile {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  membershipId: string; // Links to UserTenantMembership

  @ManyToOne(() => UserTenantMembership, { onDelete: 'CASCADE' })
  membership: UserTenantMembership;

  @Field({ nullable: true })
  @Column({ nullable: true })
  employeeId?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  department?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  qualifications?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  phoneNumber?: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
