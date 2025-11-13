import { InputType, Field, Int } from '@nestjs/graphql';
import { IsInt, IsString, Min, Max, Matches, IsOptional } from 'class-validator';

@InputType()
export class CreateTimeSlotInput {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  periodNumber: number;

  @Field()
  @IsString()
  displayTime: string; // "8:00 AM – 8:45 AM"

  @Field()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  startTime: string; // "08:00"

  @Field()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  endTime: string; // "08:45"

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  color?: string;
}
