import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, MinLength, IsString, IsEnum } from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

@InputType()
export class CreateUserInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  schoolName: string; 

  @Field()
  @IsNotEmpty()
  @IsString()
  username: string; 

  @Field()
  @IsEmail()
  email: string;

  @Field()
  @MinLength(8)
  password: string;

  @Field(() => UserRole, { defaultValue: UserRole.SUPER_ADMIN }) 
  @IsEnum(UserRole)
  userRole: UserRole; 
}