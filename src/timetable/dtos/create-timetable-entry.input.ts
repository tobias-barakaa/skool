import { InputType, Field, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsUUID, IsInt, IsString, Min, Max, ValidateNested, IsArray, ArrayMinSize, IsNotEmpty } from 'class-validator';

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
  @Min(0)
  @Max(8)
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
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SingleEntryInput)
  entries: SingleEntryInput[];
}

@InputType()
export class SingleEntryInput {
  @Field()
  @IsUUID()
  @IsNotEmpty()
  subjectId: string;

  @Field()
  @IsUUID()
  @IsNotEmpty()
  teacherId: string;

  @Field()
  @IsUUID()
  @IsNotEmpty()
  timeSlotId: string;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  @Max(8)
  dayOfWeek: number;

  @Field({ nullable: true })
  @IsString()
  roomNumber?: string;
}