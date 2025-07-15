
import { Field, ID, ObjectType } from "@nestjs/graphql";
import { UserInvitation } from "src/admin/invitation/entities/user-iInvitation.entity";
import { UserTenantMembership } from "src/admin/user-tenant-membership/entities/user-tenant-membership.entity";
import { Test } from "src/teacher/test/entities/test.entity";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@ObjectType()
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column({ unique: true })
  @Field()
  email: string;

  @Field()
  @Column()
  password: string;

  @Field()
  @Column()
  name: string;

  @Column({ type: 'boolean', default: false })
  @Field()
  isGlobalAdmin: boolean;

  @OneToMany(() => UserTenantMembership, (membership) => membership.user)
  @Field(() => [UserTenantMembership])
  memberships: UserTenantMembership[];

  @Column({ type: 'text', nullable: false })
  @Field({ nullable: false })
  schoolUrl: string;

  @OneToMany(() => UserInvitation, (invitation) => invitation.invitedBy)
  sentInvitations: UserInvitation[];

  @OneToMany(() => Test, (test) => test.teacher)
  @Field(() => [Test], { nullable: true })
  tests: Test[];

  @CreateDateColumn()
  @Field(() => Date)
  createdAt: Date;

  @UpdateDateColumn()
  @Field(() => Date)
  updatedAt: Date;
}
