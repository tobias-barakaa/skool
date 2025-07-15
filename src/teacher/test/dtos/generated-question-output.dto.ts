// src/teacher/test/dtos/generated-question-output.dto.ts
import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class GeneratedQuestionOutput {
  @Field()
  text: string;

  @Field(() => Int)
  marks: number;

  @Field(() => Int)
  order: number;

  @Field()
  type: string;

  @Field({ nullable: true })
  aiPrompt?: string;

  @Field()
  isAIGenerated: boolean;

  @Field(() => [GeneratedOptionOutput])
  options: GeneratedOptionOutput[];
}

@ObjectType()
export class GeneratedOptionOutput {
  @Field()
  text: string;

  @Field()
  isCorrect: boolean;

  @Field(() => Int)
  order: number;
}
