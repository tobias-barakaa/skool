import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class StreamDto {
  @Field(() => ID) id: string;
  @Field() name: string;
}

@ObjectType()
export class SubjectDto {
  @Field(() => ID) id: string;
  @Field() name: string;
  @Field() code: string;
  @Field() subjectType: string;
  @Field() category: string;
  @Field() department: string;
  @Field() shortName: string;
  @Field() isCompulsory: boolean;
  @Field() totalMarks: number;
  @Field() passingMarks: number;
  @Field() creditHours: number;
  @Field() curriculum: string;
}

@ObjectType()
export class GradeLevelReadDto {
  @Field(() => ID) id: string;
  @Field() name: string;
  @Field() code: string;
  @Field() order: number;

  @Field(() => [StreamDto], { nullable: true })
  streams?: StreamDto[];

  @Field({ nullable: true })
  age?: number;
}

@ObjectType()
export class LevelReadDto {
  @Field(() => ID) id: string;
  @Field() name: string;
  @Field({ nullable: true }) description?: string;

  @Field(() => [SubjectDto])
  subjects: SubjectDto[];

  @Field(() => [GradeLevelReadDto])
  gradeLevels: GradeLevelReadDto[];
}

@ObjectType()
export class TenantReadDto {
  @Field(() => ID) id: string;
  @Field() schoolName: string;
  @Field({ nullable: true }) subdomain?: string;
}

@ObjectType()
export class SchoolConfigurationReadResponse {
  @Field(() => ID) id: string;
  @Field(() => [LevelReadDto]) selectedLevels: LevelReadDto[];
  @Field(() => TenantReadDto) tenant: TenantReadDto;
  @Field() createdAt: Date;
}
