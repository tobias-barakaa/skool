import { InputType, Field, ObjectType } from '@nestjs/graphql';
import { MembershipRole, UserTenantMembership } from 'src/user-tenant-membership/entities/user-tenant-membership.entity';
import { User } from '../entities/user.entity';
import { IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';
import { Tenant } from 'src/tenants/entities/tenant.entity';

@InputType('SignupInput')
export class SignupInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @Length(6, 32)
  password: string;

  @Field()
  @Length(2, 50)
  name: string;

  @Field()
  @Length(2, 100)
  schoolName: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional() 
  schoolUrl?: string;
}



@InputType()
export class InvitationSignupInput {
  @Field()
  email: string;

  @Field()
  password: string;

  @Field()
  name: string;

  @Field()
  invitationToken: string;
}

@InputType()
export class SendInvitationInput {
  @Field()
  email: string;

  @Field(() => MembershipRole)
  role: MembershipRole;

  @Field()
  tenantId: string;

  @Field({ nullable: true })
  message?: string;
}

export class TenantSignUPResponse {
  id: string;
  name: string;
  subdomain: string;
}

@ObjectType()
export class AuthResponse {

    @Field(() => TokenPair)
    tokens: {
      accessToken: string;
      refreshToken: string;
    };

  @Field(() => User)
  user: User;

  @Field(() => UserTenantMembership, { nullable: true })
  membership?: UserTenantMembership;

  @Field(() => String)
  subdomainUrl: string;

  @Field(() => TenantSignUPResponse)
  tenant: {
    id: string;
    name: string;
    subdomain: string;
  }
}


@ObjectType()
export class TokenPair {
  @Field()
  accessToken: string;

  @Field()
  refreshToken: string;
}

@ObjectType()
export class InvitationInfo {
  @Field()
  email: string;

  @Field(() => MembershipRole)
  role: MembershipRole;

  @Field()
  tenantName: string;
}

@ObjectType()
export class InvitationValidationResponse {
  @Field()
  valid: boolean;

  @Field({ nullable: true })
  error?: string;

  @Field(() => InvitationInfo, { nullable: true })
  invitation?: InvitationInfo;
}