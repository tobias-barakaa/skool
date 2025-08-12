import { InputType, Field } from '@nestjs/graphql';
import {
  IsUUID,
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
} from 'class-validator';

@InputType()
export class CreateCustomSubjectInput {
  @Field()
  @IsString()
  name: string;

  @Field()
  @IsString()
  code: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  shortName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  category?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  department?: string;

  @Field(() => String, { defaultValue: 'core' })
  @IsString()
  @IsOptional()
  subjectType?: 'core' | 'elective';

  @Field(() => Boolean, { defaultValue: true })
  @IsBoolean()
  @IsOptional()
  isCompulsory?: boolean;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsNumber()
  totalMarks?: number;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsNumber()
  passingMarks?: number;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsNumber()
  creditHours?: number;

  @Field(() => String)
  @IsUUID()
  curriculumId: string;
}
