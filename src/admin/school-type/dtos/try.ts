// school-configuration.dto.ts
import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import { SchoolLevel } from '../entities/school_level.entity';
import { GradeLevel } from '../../level/entities/grade-level.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

@InputType()
export class ConfigureSchoolLevelsInput {
  @Field(() => [String])
  levelNames: string[];
}

@ObjectType()
export class SchoolConfigurationResponse {
  @Field(() => ID)
  id: string;

  @Field(() => [SchoolLevel])
  selectedLevels: SchoolLevel[];

  @Field(() => Tenant)
  tenant: Tenant;

  @Field()
  createdAt: Date;
}
