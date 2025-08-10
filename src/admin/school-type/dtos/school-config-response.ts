import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Level } from 'src/admin/level/entities/level.entities';
import { GradeLevel } from 'src/admin/level/entities/grade-level.entity';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';

@ObjectType()
export class GradeLevelResponse {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  code: string;

  @Field()
  order: number;
}

@ObjectType()
export class SelectedLevelResponse {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field(() => [GradeLevelResponse])
  gradeLevels: GradeLevelResponse[];
}

@ObjectType()
export class TenantResponse {
  @Field(() => ID)
  id: string;

  @Field()
  schoolName: string;
}

@ObjectType()
export class SchoolConfigurationResponse {
  @Field(() => ID)
  id: string;

  @Field(() => [SelectedLevelResponse])
  selectedLevels: SelectedLevelResponse[];

  @Field(() => TenantResponse)
  tenant: TenantResponse;

  @Field()
  createdAt: Date;
}
