import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOptionInput } from './create-option-input.dto';


@InputType()
export class CreateQuestionInput {
  @Field()
  @IsNotEmpty()
  text: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  imageUrls?: string[];

  @Field(() => Int)
  @IsNumber()
  marks: number;

  @Field(() => Int)
  @IsNumber()
  order: number;

  @Field()
  @IsEnum(['multiple_choice', 'short_answer', 'true_false'])
  type: 'multiple_choice' | 'short_answer' | 'true_false';

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
