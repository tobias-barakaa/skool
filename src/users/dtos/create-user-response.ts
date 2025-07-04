import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '../entities/user.entity';
import { School } from '../../school/entities/school.entity';
import { TokensOutput } from './tokens.output';
import { Tenant } from 'src/tenants/entities/tenant.entity';
import { UserTenantMembership } from 'src/user-tenant-membership/entities/user-tenant-membership.entity';


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
