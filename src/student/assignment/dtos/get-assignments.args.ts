import { ArgsType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { IsOptional, IsUUID, IsEnum } from 'class-validator';

export enum AssignmentStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  GRADED = 'GRADED',
  OVERDUE = 'OVERDUE',
}

// 👇 this is missing in your code
registerEnumType(AssignmentStatus, {
  name: 'AssignmentStatus',
  description: 'Status of the student assignment',
});

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
