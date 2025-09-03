import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsString, IsOptional, IsUrl, MaxLength } from 'class-validator';

@InputType()
export class CreateAssignmentSubmissionInput {
  @Field(() => ID)
  @IsUUID()
  assignmentId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  submissionText?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  fileUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comments?: string;
}