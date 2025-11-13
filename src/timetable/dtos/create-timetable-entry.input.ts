import { InputType, Field, Int } from '@nestjs/graphql';
import { IsUUID, IsInt, IsString, Min, Max } from 'class-validator';

@InputType()
export class CreateTimetableEntryInput {
  @Field()
  @IsUUID()
  termId: string;

  @Field()
  @IsUUID()
  gradeId: string;

  @Field()
  @IsUUID()
  subjectId: string;

  @Field()
  @IsUUID()
  teacherId: string;

  @Field()
  @IsUUID()
  timeSlotId: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(5)
  dayOfWeek: number;

  @Field({ nullable: true })
  @IsString()
  roomNumber?: string;
}

@InputType()
export class BulkCreateTimetableEntryInput {
  @Field()
  @IsUUID()
  termId: string;

  @Field()
  @IsUUID()
  gradeId: string;

  @Field(() => [SingleEntryInput])
  entries: SingleEntryInput[];
}

@InputType()
export class SingleEntryInput {
  @Field()
  @IsUUID()
  subjectId: string;

  @Field()
  @IsUUID()
  teacherId: string;

  @Field()
  @IsUUID()
  timeSlotId: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(5)
  dayOfWeek: number;

  @Field({ nullable: true })
  @IsString()
  roomNumber?: string;
}
