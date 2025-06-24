import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Stream } from 'src/streams/entities/streams.entity';


@ObjectType()
export class GradeLevelResponse {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  code?: string;

  @Field({ nullable: true })
  order?: number;

  @Field({ nullable: true })
  age?: string;

  // ✅ Fix is here: explicitly define type of array
  @Field(() => [Stream], { nullable: true })
  streams?: Stream[];
}




@ObjectType()
export class SubjectResponse {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  code: string;

  @Field({ nullable: true })
  subjectType?: string;

  @Field({ nullable: true })
  category?: string;

  @Field({ nullable: true })
  department?: string;

  @Field({ nullable: true })
  shortName?: string;

  @Field({ nullable: true })
  isCompulsory?: boolean;

  @Field({ nullable: true })
  totalMarks?: number;

  @Field({ nullable: true })
  passingMarks?: number;

  @Field({ nullable: true })
  creditHours?: number;

  @Field({ nullable: true })
  curriculum?: string;
}


@ObjectType()
export class SchoolTypeResponse {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  displayName: string;
}

@ObjectType()
export class SelectedLevelResponse {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  displayName?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  code?: string;

  @Field({ nullable: true })
  ageRange?: string;

  @Field(() => [GradeLevelResponse], { nullable: true })
  gradeLevels?: GradeLevelResponse[];

  @Field(() => [SubjectResponse], { nullable: true })
  subjects?: SubjectResponse[];
}


@ObjectType()
export class SchoolResponse {
  @Field(() => ID)
  schoolId: string;

  @Field()
  schoolName: string;

  @Field()
  subdomain: string;
}

@ObjectType()
export class SchoolConfigurationResponse {
  @Field(() => ID)
  id: string;

  @Field(() => SchoolResponse)
  school: SchoolResponse;

  @Field(() => SchoolTypeResponse, { nullable: true })
  schoolType?: SchoolTypeResponse;

  @Field(() => [SelectedLevelResponse])
  selectedLevels: SelectedLevelResponse[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

