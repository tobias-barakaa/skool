import { InputType, Field } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AssessType } from '../enums/assesment-type.enum';

@InputType()
export class AssessmentFilterInput {
  @Field(() => AssessType, { nullable: true })
  @IsOptional()
  @IsEnum(AssessType)
  type?: AssessType;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  tenantGradeLevelId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  tenantSubjectId?: string;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  term?: number;
}
