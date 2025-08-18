import { InputType, Field } from '@nestjs/graphql';
import { IsEnum, IsString, IsNumber, IsOptional } from 'class-validator';
import { AssesStatus } from '../enums/assesment-status.enum';
import { AssessType } from '../enums/assesment-type.enum';

@InputType()
export class CreateAssessmentInput {
  @Field(() => AssessType)
  @IsEnum(AssessType)
  type: AssessType;

  @Field()
  @IsString()
  tenantGradeLevelId: string;

  @Field()
  @IsString()
  tenantSubjectId: string;

  @Field(() => Number)
  @IsNumber()
  term: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  cutoff?: number;

  @Field(() => AssesStatus, { nullable: true })
  @IsOptional()
  @IsEnum(AssesStatus)
  status?: AssesStatus;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsNumber()
  maxScore?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;
}
