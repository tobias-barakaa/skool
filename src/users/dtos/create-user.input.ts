// create-user.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength, IsNotEmpty, IsEnum } from 'class-validator';

@InputType()
export class CreateUserInput {
  @Field()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @Field()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  
  @Field()
  @IsNotEmpty()
  userRole: string;

  @Field()
  @IsString()
  @IsNotEmpty({ message: 'School name is required' })
  schoolName: string;
}
