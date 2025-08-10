// src/marksheet/assessment/dto/assessment.output.ts

import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { AssessmentStatus, AssessmentType } from '../entity/assessment.entity';

@ObjectType()
export class SubjectOutput {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;
}


@ObjectType()
export class GradeLevelOutput {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;
}



@ObjectType()
export class AssessmentOutput {
  @Field(() => ID)
  id: string;

  @Field()
  type: AssessmentType;

  @Field()
  title: string;

  @Field(() => Float)
  cutoff: number;

  @Field()
  status: AssessmentStatus;

  @Field(() => SubjectOutput, { nullable: true })
  subject?: SubjectOutput;

  @Field(() => GradeLevelOutput, { nullable: true })
  gradeLevel?: GradeLevelOutput;

  @Field()
  term: string;

  @Field()
  tenantId: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
