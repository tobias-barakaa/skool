import { InputType,  PartialType, ID } from '@nestjs/graphql';
import { CreateTestInput } from './create-test-input.dto';

@InputType()
export class UpdateTestInput extends PartialType(CreateTestInput) {
  @Field(() => ID)
  id: string;
}

// src/teacher/test/dtos/test-output.dto.ts
import { ObjectType, Field,  Int } from '@nestjs/graphql';

@ObjectType()
export class TestOutput {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  subject: string;

  @Field()
  grade: string;

  @Field()
  date: Date;

  @Field()
  startTime: string;

  @Field({ nullable: true })
  endTime?: string;

  @Field(() => Int)
  duration: number;

  @Field(() => Int)
  totalMarks: number;

  @Field({ nullable: true })
  resourceUrl?: string;

  @Field({ nullable: true })
  instructions?: string;

  @Field()
  status: string;

  @Field(() => Int)
  questionsCount: number;

  @Field(() => Int)
  referenceMaterialsCount: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
