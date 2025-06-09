// src/user/dto/update-user.input.ts
import { InputType, Field, PartialType, ID } from '@nestjs/graphql';
import { CreateUserInput } from './user-signup.input';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType()
export class UpdateUserInput extends PartialType(CreateUserInput) {
  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @Field(() => ID, { nullable: true })
  @IsUUID()
  schoolId?: string; // School cannot be changed after creation easily
}