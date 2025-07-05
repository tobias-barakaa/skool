import { InputType, Field } from '@nestjs/graphql';
import { IsString, MinLength, Matches } from 'class-validator';

@InputType()
export class ChangePasswordInput {
  @Field()
  @IsString()
  currentPassword: string;

  @Field()
  @IsString()
  @MinLength(6)
  newPassword: string;

  @Field()
  @IsString()
  confirmPassword: string;
}