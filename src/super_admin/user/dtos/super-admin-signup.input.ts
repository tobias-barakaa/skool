import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, Length } from 'class-validator';

@InputType()
export class SuperAdminSignupInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @Length(6, 32)
  password: string;

  @Field()
  @Length(2, 50)
  name: string;
}
