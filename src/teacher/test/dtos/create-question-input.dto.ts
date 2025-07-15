import { InputType, Field, Int, registerEnumType } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  IsString,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOptionInput } from './create-option-input.dto';

// ✅ 1. Define enum
export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  SHORT_ANSWER = 'short_answer',
  TRUE_FALSE = 'true_false',
}

// ✅ 2. Register enum for GraphQL
registerEnumType(QuestionType, {
  name: 'QuestionType',
});


@InputType()
export class CreateQuestionInput {
  @Field()
  @IsNotEmpty({ message: 'Question text is required' })
  text: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray({ message: 'Image URLs must be an array' })
  imageUrls?: string[];

  @Field(() => Int)
  @IsNumber({}, { message: 'Marks must be a number' })
  @Min(1, { message: 'Marks must be at least 1' })
  marks: number;

  @Field(() => Int)
  @IsNumber({}, { message: 'Order must be a number' })
  @Min(1, { message: 'Order must be at least 1' })
  order: number;

  @Field(() => QuestionType)
  @IsEnum(QuestionType, { message: 'Invalid question type' })
  type: QuestionType;

  @Field({ nullable: true })
  @IsOptional()
  aiPrompt?: string;

  @Field()
  isAIGenerated: boolean;

  @Field(() => [CreateOptionInput], { nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionInput)
  options?: CreateOptionInput[];
}
