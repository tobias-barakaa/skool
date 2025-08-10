import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class GradeLevelDto {
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
export class LevelDto {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field(() => [GradeLevelDto])
  gradeLevels: GradeLevelDto[];
}
// @Field(() => [SubjectDto], { nullable: true })   // <-- add nullable
//   subjects?: SubjectDto[];

@ObjectType()
export class TenantDto {
  @Field(() => ID)
  id: string;

  @Field()
  schoolName: string;
}

@ObjectType()
export class SchoolConfigurationResponse {
  @Field(() => ID)
  id: string;

  @Field(() => [LevelDto])
  selectedLevels: LevelDto[];

  @Field(() => TenantDto)
  tenant: TenantDto;

  @Field()
  createdAt: Date;
}
