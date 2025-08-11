import { ObjectType, Field, ID } from '@nestjs/graphql';




@ObjectType()
export class SubjectInfo {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  code?: string;

  @Field()
  subjectType: string;

  @Field({ nullable: true })
  category?: string;

  @Field({ nullable: true })
  department?: string;

  @Field({ nullable: true })
  shortName?: string;

  @Field()
  isCompulsory: boolean;

  @Field(() => Number, { nullable: true })
  totalMarks?: number;

  @Field(() => Number, { nullable: true })
  passingMarks?: number;

  @Field(() => Number, { nullable: true })
  creditHours?: number;
}

@ObjectType()
export class TenantInfo {
  @Field(() => ID)
  id: string;

  @Field()
  schoolName: string;

  @Field({ nullable: true })
  subdomain?: string;
}
@ObjectType()
export class SchoolConfigurationResponse {
  @Field(() => ID)
  id: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => TenantInfo)
  tenant: TenantInfo;

  @Field(() => [SelectedLevel])
  selectedLevels: SelectedLevel[];

  @Field(() => [SubjectInfo], { nullable: true })
  subjects?: SubjectInfo[];
}

@ObjectType()
export class SelectedLevel {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => [GradeLevelInfo])
  gradeLevels: GradeLevelInfo[];

  @Field(() => [SubjectInfo])
  subjects: SubjectInfo[];
}

@ObjectType()
export class StreamInfo {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;
}
@ObjectType()
export class GradeLevelInfo {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  code?: string;

  @Field(() => Number, { nullable: true })
  order?: number;

  @Field(() => Number, { nullable: true })
  age?: number;

  @Field(() => [StreamInfo])
  streams: StreamInfo[];
}
