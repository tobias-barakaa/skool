import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

@InputType()
export class CreateUserInput {
  @Field()
  @IsString()
  @MaxLength(100)
  firstName: string;

  @Field()
  @IsString()
  @MaxLength(100)
  lastName: string;

  @Field()
  @IsEmail()
  email: string;

  @Field(() => UserRole)
  @IsEnum(UserRole)
  role: UserRole;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  bio?: string;
}