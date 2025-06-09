// src/auth/dto/admin-signup.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, MinLength, IsString, IsOptional, Matches } from 'class-validator';

@InputType()
export class AdminSignupInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  schoolName: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  adminName: string; // Corresponds to User.username

  @Field()
  @IsEmail()
  email: string;

  @Field()
  @MinLength(8)
  password: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Subdomain can only contain lowercase letters, numbers, and hyphens.',
  })
  subdomain?: string;
}