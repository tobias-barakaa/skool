import { ObjectType, Field, ID } from '@nestjs/graphql';
import { UserInvitation } from 'src/invitation/entities/user-iInvitation.entity';
import { UserTenantMembership } from 'src/user-tenant-membership/entities/user-tenant-membership.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

@ObjectType()
@Entity('tenants')
export class Tenant {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string; 

  @Field()
  @Column({ unique: true })
  subdomain: string;


  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @Field()
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

 

  @OneToMany(() => UserTenantMembership, membership => membership.tenant)
  @Field(() => [UserTenantMembership])
  memberships: UserTenantMembership[];

  @OneToMany(() => UserInvitation, invitation => invitation.tenant)
  invitations: UserInvitation[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}