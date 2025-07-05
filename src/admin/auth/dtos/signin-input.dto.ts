import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import { UserTenantMembership } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { User } from 'src/admin/users/entities/user.entity';

@InputType()
export class SignInInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsString()
  @MinLength(6)
  password: string;
}

@ObjectType()
export class TokenResponse {
  @Field()
  accessToken: string;

  @Field()
  refreshToken: string;
}

@ObjectType()
export class AuthResponse {
  @Field(() => User)
  user: User;

  @Field(() => UserTenantMembership, { nullable: true })
  membership?: UserTenantMembership;

  @Field(() => [UserTenantMembership], { nullable: true })
  allMemberships?: UserTenantMembership[];

  @Field()
  subdomainUrl: string;

  @Field(() => TokenResponse)
  tokens: TokenResponse;

  @Field(() => Tenant)
  tenant: Tenant;
}
