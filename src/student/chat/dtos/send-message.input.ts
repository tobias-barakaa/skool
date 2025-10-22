import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsString, IsOptional, IsUrl, MaxLength } from 'class-validator';

@InputType()
export class SendMessageToTeacherInput {
  @Field(() => ID)
  @IsUUID()
  recipientId: string; // Teacher ID from teachers table

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @Field()
  @IsString()
  @MaxLength(2000)
  message: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}

// import { InputType, Field, ID } from '@nestjs/graphql';
// import { IsUUID, IsString, IsOptional, IsUrl, MaxLength, IsEnum } from 'class-validator';

// export enum RecipientType {
//   TEACHER = 'TEACHER',
//   STUDENT = 'STUDENT',
// }

// @InputType()
// export class SendMessageToTeacherInput {
//   @Field(() => ID)
//   @IsUUID()
//   recipientId: string; 

//   @Field()
//   @IsString()
//   @MaxLength(200)
//   subject: string;

//   @Field()
//   @IsString()
//   @MaxLength(2000)
//   message: string;

//   @Field({ nullable: true })
//   @IsOptional()
//   @IsUrl()
//   imageUrl?: string;
// }