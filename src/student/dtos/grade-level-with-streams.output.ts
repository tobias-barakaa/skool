import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class StreamOutput {
  @Field()
  id: string;

  @Field()
  name: string;
}

@ObjectType()
export class GradeLevelWithStreamsOutput {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field(() => [StreamOutput])
  streams: StreamOutput[];
}
