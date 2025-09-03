import { ArgsType, Field, ID } from '@nestjs/graphql';
import { IsOptional, IsUUID, IsEnum } from 'class-validator';

export enum AssignmentStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  GRADED = 'GRADED',
  OVERDUE = 'OVERDUE'
}

@ArgsType()
export class GetAssignmentsArgs {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @Field(() => AssignmentStatus, { nullable: true })
  @IsOptional()
  @IsEnum(AssignmentStatus)
  status?: AssignmentStatus;

  @Field({ nullable: true, defaultValue: 10 })
  @IsOptional()
  limit?: number = 10;

  @Field({ nullable: true, defaultValue: 0 })
  @IsOptional()
  offset?: number = 0;
}