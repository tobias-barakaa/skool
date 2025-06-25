import { ObjectType, Field, ID } from '@nestjs/graphql';
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
  name: string; // School name

  @Field()
  @Column({ unique: true })
  subdomain: string;

//   @Field({ nullable: true })
//   @Column({ type: 'jsonb', nullable: true })
//   configuration?: Record<string, any>; 

  @OneToMany(() => UserTenantMembership, membership => membership.tenant)
  memberships: UserTenantMembership[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
