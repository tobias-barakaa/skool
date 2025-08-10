import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class SubjectReadResponseGQL {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  code: string;

  @Field()
  subjectType: string;

  @Field()
  category: string;

  @Field()
  department: string;

  @Field()
  shortName: string;

  @Field()
  isCompulsory: boolean;

  @Field()
  totalMarks: number;

  @Field()
  passingMarks: number;

  @Field()
  creditHours: number;

  @Field()
  curriculum: string;
}

@ObjectType()
export class StreamReadResponseGQL {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;
}

@ObjectType()
export class GradeLevelReadResponseGQL {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field(() => [StreamReadResponseGQL])
  streams: StreamReadResponseGQL[];

  @Field()
  code: string;
  
  @Field()
  order: number;

  @Field()
  age: number;
}

@ObjectType()
export class SelectedLevelReadResponseGQL {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  description: string;

  @Field(() => [SubjectReadResponseGQL])
  subjects: SubjectReadResponseGQL[];

  @Field(() => [GradeLevelReadResponseGQL])
  gradeLevels: GradeLevelReadResponseGQL[];
}

@ObjectType()
export class TenantReadResponseGQL {
  @Field(() => ID)
  id: string;

  @Field()
  schoolName: string;

  @Field()
  subdomain: string;
}

@ObjectType()
export class SchoolConfigurationReadResponseGQL {
  @Field(() => ID)
  id: string;

  @Field(() => [SelectedLevelReadResponseGQL])
  selectedLevels: SelectedLevelReadResponseGQL[];

  @Field(() => TenantReadResponseGQL)
  tenant: TenantReadResponseGQL[];
}
