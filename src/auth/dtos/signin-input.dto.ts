import { InputType, Field, ObjectType } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { User } from 'src/users/entities/user.entity';
import { UserTenantMembership } from 'src/user-tenant-membership/entities/user-tenant-membership.entity';

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

  @Field(() => [UserTenantMembership], { nullable: true }) // ✅ Add this
  allMemberships?: UserTenantMembership[];

  @Field()
  subdomainUrl: string;

  @Field(() => TokenResponse)
  tokens: TokenResponse;
}
