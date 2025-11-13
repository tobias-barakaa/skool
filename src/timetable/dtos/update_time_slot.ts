import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { IsOptional, IsInt, Min, Max, IsString, Matches } from 'class-validator';
import { CreateTimeSlotInput } from './create_time_slot';

@InputType()
export class UpdateTimeSlotInput extends PartialType(CreateTimeSlotInput) {
  @Field(() => Int)
  @IsInt()
  id: number; 
}
