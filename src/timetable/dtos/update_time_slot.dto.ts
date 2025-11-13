import { InputType, Field, Int, ObjectType } from '@nestjs/graphql';
import { IsInt, IsEnum, IsUUID, IsOptional, Min, Max, IsString } from 'class-validator';

@InputType()
export class UpdateTimeSlotInput {
  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(1)
  periodNumber?: number;

  @Field({ nullable: true })
  @IsString()
  displayTime?: string;

  @Field({ nullable: true })
  @IsString()
  startTime?: string;

  @Field({ nullable: true })
  @IsString()
  endTime?: string;

  @Field({ nullable: true })
  @IsString()
  color?: string;

  @Field({ nullable: true })
  isActive?: boolean;
}