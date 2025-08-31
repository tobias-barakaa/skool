import { ObjectType, Field, ID } from '@nestjs/graphql';
import { UserInvitation } from 'src/admin/invitation/entities/user-iInvitation.entity';
import { School } from 'src/admin/school/entities/school.entity';
import { Stream } from 'src/admin/streams/entities/streams.entity';
import { UserTenantMembership } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ScaleTier } from '../dtos/scale-dto';
import { Hostel } from 'src/admin/hostels/entities/hostel.entity';

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

  @OneToMany(() => Hostel, (hostel) => hostel.tenant)
  hostels: Hostel[];

  @OneToMany(() => UserTenantMembership, (membership) => membership.tenant)
  @Field(() => [UserTenantMembership])
  memberships: UserTenantMembership[];

  @OneToMany(() => UserInvitation, (invitation) => invitation.tenant)
  invitations: UserInvitation[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => School, (school) => school.tenant)
  schools: School[];

  @OneToMany(() => Stream, (stream) => stream.tenant)
  streams: Stream[];
}
