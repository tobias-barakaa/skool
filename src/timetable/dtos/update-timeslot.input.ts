import { InputType, Field, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';

@InputType()
export class UpdateTimeSlotInput {
  @Field()
  @IsString()
  id: string; // UUID of the timeslot

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  periodNumber?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  displayTime?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  startTime?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  endTime?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  color?: string;
}
