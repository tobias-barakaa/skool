import { InputType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsUUID, IsOptional, IsUrl } from 'class-validator';

@InputType()
export class SendMessageFromParentInput {
  @Field(() => ID, { description: 'Teacher ID to send message to' })
  @IsNotEmpty()
  @IsUUID()
  recipientId: string;

  @Field(() => ID, { description: 'Student ID (child) this message is about' })
  @IsNotEmpty()
  @IsUUID()
  studentId: string;

  @Field({ nullable: true, description: 'Message subject' })
  @IsOptional()
  @IsString()
  subject?: string;

  @Field({ description: 'Message content' })
  @IsNotEmpty()
  @IsString()
  message: string;

  @Field({ nullable: true, description: 'Optional image URL' })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}