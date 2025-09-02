// create-hostel-assignment.input.ts
import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsOptional, IsString } from 'class-validator';

@InputType()
export class CreateHostelAssignmentInput {
  @Field(() => ID)
  @IsUUID()
  hostelId: string;

  @Field(() => ID)
  @IsUUID()
  studentId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  roomNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  bedNumber?: string;
}
