import { Field, ObjectType } from '@nestjs/graphql';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import { School } from '../../school/entities/school.entity';
import { User } from '../entities/user.entity';
import { TokensOutput } from './tokens.output';
import { UserTenantMembership } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';

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
