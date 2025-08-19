import { InputType, Field, Int, registerEnumType } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsString,
  IsArray,
  ValidateNested,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOptionInput } from './create-option-input.dto';

// ✅ 1. Define enum
export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  SHORT_ANSWER = 'short_answer',
  TRUE_FALSE = 'true_false',
}

// ✅ 2. Register enum for GraphQL with proper mapping
registerEnumType(QuestionType, {
  name: 'QuestionType',
  description: 'The supported question types',
  valuesMap: {
    MULTIPLE_CHOICE: {
      description: 'Multiple choice question with several options',
    },
    SHORT_ANSWER: {
      description: 'Short answer question requiring text input',
    },
    TRUE_FALSE: {
      description: 'True or false question',
    },
  },
});

@InputType()
export class CreateQuestionInput {
  @Field()
  @IsNotEmpty({ message: 'Question text is required' })
  @IsString({ message: 'Question text must be a string' })
  text: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray({ message: 'Image URLs must be an array' })
  @IsString({ each: true, message: 'Each image URL must be a string' })
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
  @IsString({ message: 'AI prompt must be a string' })
  aiPrompt?: string;

  @Field()
  @IsBoolean({ message: 'isAIGenerated must be a boolean' })
  isAIGenerated: boolean;

  @Field(() => [CreateOptionInput], { nullable: true })
  @IsOptional()
  @IsArray({ message: 'Options must be an array' })
  @ValidateNested({ each: true })
  @Type(() => CreateOptionInput)
  options?: CreateOptionInput[];
}
