// import { InputType, Field, Int, ObjectType } from '@nestjs/graphql';
// import { IsInt, IsEnum, IsUUID, IsOptional, Min, Max, IsString } from 'class-validator';

// @InputType()
// export class CreateTimeSlotInput {
//   @Field(() => Int)
//   @IsInt()
//   @Min(0)
//   @Max(20)
//   periodNumber: number;

//   @Field()
//   @IsString()
//   startTime: string; // "08:00:00"

//   @Field()
//   @IsString()
//   endTime: string; // "08:45:00"

//   @Field({ nullable: true })
//   @IsOptional()
//   @IsString()
//   label?: string;
// }
