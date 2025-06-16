import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class TokensOutput {
  @Field(() => String)
  accessToken: string;

  @Field(() => String)
  refreshToken: string;
}






