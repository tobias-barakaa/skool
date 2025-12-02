import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import { School } from '../../school/entities/school.entity';
import { User } from '../entities/user.entity';
import { TokensOutput } from './tokens.output';
import { UserTenantMembership } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

@ObjectType()
export class CreateUserResponse {
  @Field(() => User)
  user: User;

  @Field(() => School)
  school: School;

  @Field(() => String)
  subdomainUrl: string;

  @Field(() => TokensOutput)
  tokens: TokensOutput;

  @Field(() => Tenant)
  tenant: Tenant;

  @Field(() => UserTenantMembership, { nullable: true })
  membership?: UserTenantMembership;
}


@InputType()
export class ChangePasswordsInput {
  @Field()
  @IsString()
  @MinLength(6, { message: 'Old password must be at least 6 characters long' })
  oldPassword: string;

  @Field()
  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  @MaxLength(50, { message: 'New password is too long' })
  // @Matches(
  //   /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).+$/,
  //   {
  //     message:
  //       'New password must contain at least: one uppercase letter, one lowercase letter, and one number',
  //   },
  // )
  newPassword: string;
}



@ObjectType()
export class PasswordResetsResponse {
  @Field()
  success: boolean;

  @Field({ nullable: true })
  message?: string;
}
