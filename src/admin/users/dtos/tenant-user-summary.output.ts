// dtos/tenant-user-summary.output.ts
import { Field, ObjectType } from '@nestjs/graphql';
import { MembershipRole } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';

@ObjectType()
export class TenantUserSummary {
  @Field()
  id: string;

  @Field()
  email: string;

  @Field()
  name: string;

  @Field()
  tenantId: string;

  @Field(() => MembershipRole)
  role: MembershipRole;
}
