import { InputType, Field } from '@nestjs/graphql';
import { IsString, MinLength } from 'class-validator';

@InputType()
export class AcceptInvitationInput {
  @Field()
  @IsString()
  token: string;

  @Field()
  @IsString()
  @MinLength(6)
  password: string;
}
