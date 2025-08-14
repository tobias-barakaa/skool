import { InputType, Field } from '@nestjs/graphql';
import { AssesStatus } from '../enums/assesment-status.enum';
import { AssessType } from '../enums/assesment-type.enum';

@InputType()
export class CreateAssessmentInput {
  @Field(() => AssessType)
  type: AssessType;

  @Field()
  tenantGradeLevelId: string;

  @Field()
  tenantSubjectId: string;

  @Field(() => Number)
  term: number;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  cutoff?: number;

  @Field(() => AssesStatus, { nullable: true })
  status?: AssesStatus;

  @Field({ nullable: true })
  date?: Date;

  @Field(() => Number, { nullable: true })
  maxScore?: number;

  @Field({ nullable: true })
  description?: string;
}
