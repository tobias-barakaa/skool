import { InputType, Field, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

@InputType()
export class GenerateQuestionsInput {
  @Field(() => Int)
  @IsNumber()
  numberOfQuestions: number;

  @Field({ nullable: true })
  @IsOptional()
  sampleQuestion?: string;

  @Field()
  @IsNotEmpty()
  prompt: string;

  @Field()
  @IsNotEmpty()
  subject: string;

  @Field()
  @IsNotEmpty()
  grade: string;

  @Field(() => Int)
  @IsNumber()
  marksPerQuestion: number;
}
