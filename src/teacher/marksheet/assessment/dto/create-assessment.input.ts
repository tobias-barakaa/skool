import { InputType, Field, Float } from '@nestjs/graphql';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Min,
  Max,
  IsOptional,
} from 'class-validator';
import { AssessmentStatus, AssessmentType } from '../entity/assessment.entity';


@InputType()
export class CreateAssessmentInput {
  @Field()
  @IsEnum(AssessmentType)
  type: AssessmentType;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  title?: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  @Max(100)
  cutoff: number;

  @Field()
  @IsEnum(AssessmentStatus)
  status: AssessmentStatus;

  @Field()
  @IsUUID()
  subjectId: string;

  @Field()
  @IsUUID()
  gradeLevelId: string;

  @Field()
  @IsString()
  term: string;
}
