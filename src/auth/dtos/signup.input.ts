// src/auth/dto/signup.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, MinLength, IsString } from 'class-validator';

@InputType()
export class SignupInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  schoolName: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  username: string; // This is the "Admin Name"

  @Field()
  @IsEmail()
  email: string;

  @Field()
  @MinLength(8)
  password: string;
}