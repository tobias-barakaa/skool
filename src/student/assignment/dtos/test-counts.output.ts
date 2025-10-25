import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class TestCountsOutput {
  @Field(() => Int, { description: 'Total number of tests available to the student' })
  total: number;

  @Field(() => Int, { description: 'Number of tests that are pending' })
  pending: number;

  @Field(() => Int, { description: 'Number of tests that are currently active' })
  active: number;

  @Field(() => Int, { description: 'Number of tests that have been completed' })
  completed: number;
}
