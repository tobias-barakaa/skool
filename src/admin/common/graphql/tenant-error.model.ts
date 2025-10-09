import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class TenantError {
  @Field(() => String, { description: 'A unique code for this error type (e.g., TENANT_RESOURCE_NOT_FOUND)' })
  code: string;

  @Field(() => String)
  message: string;

  @Field(() => [String], { nullable: true, description: 'List of IDs that were missing' })
  missingIds?: string[];
}