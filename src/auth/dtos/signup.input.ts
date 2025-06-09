import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength, MaxLength, IsOptional, Matches } from 'class-validator';

@InputType()
export class SignupInput {
  @Field()
  @IsString()
  @MaxLength(200)
  schoolName: string;

  @Field()
  @IsString()
  @MaxLength(100)
  adminFirstName: string;

  @Field()
  @IsString()
  @MaxLength(100)
  adminLastName: string;

  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Subdomain can only contain lowercase letters, numbers, and hyphens'
  })
  subdomain?: string;
}
