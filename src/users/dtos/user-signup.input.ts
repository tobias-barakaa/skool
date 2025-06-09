// src/user/dto/create-user.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, MinLength, IsString, IsEnum } from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

@InputType()
export class CreateUserInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  schoolName: string; // "School Name" from your request

  @Field()
  @IsNotEmpty()
  @IsString()
  username: string; // "Admin Name" from your request

  @Field()
  @IsEmail()
  email: string;

  @Field()
  @MinLength(8)
  password: string;

  @Field(() => UserRole, { defaultValue: UserRole.SUPER_ADMIN }) // Default to SCHOOL_ADMIN as requested
  @IsEnum(UserRole)
  userRole: UserRole; // Allows choosing, but defaults to admin
}