import { InputType, Field, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsUUID, IsInt, IsString, Min, Max, ValidateNested, IsArray, ArrayMinSize, IsNotEmpty, IsOptional } from 'class-validator';

import { 
  
  ValidationArguments,
  registerDecorator,
  ValidationOptions
} from 'class-validator';

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
//   @Min(1)  // Changed from 0
// @Max(7) 
  dayOfWeek: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  roomNumber?: string | null;
}



// Custom validator to log the actual value
function LogValue(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'logValue',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          console.log(`Field "${args.property}" received value:`, value, typeof value);
          return true; // Always pass, just for logging
        },
      },
    });
  };
}

@InputType()
export class SingleEntryInput {
  @Field()
  @IsUUID()
  @IsNotEmpty()
  @LogValue() // Add logging
  subjectId: string;

  @Field()
  @IsUUID()
  @IsNotEmpty()
  @LogValue() // Add logging
  teacherId: string;

  @Field()
  @IsUUID()
  @IsNotEmpty()
  @LogValue() // Add logging
  timeSlotId: string;

  @Field(() => Int)
  @IsInt()
//   @Min(1)  // Changed from 0
// @Max(7) 
  @LogValue() // Add logging
  dayOfWeek: number;

  // @Field({ nullable: true })
  // @IsString()
  // roomNumber?: string;

  @Field({ nullable: true })
@IsOptional()
@IsString()
roomNumber?: string | null;
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
  @LogValue() // Add logging
  entries: SingleEntryInput[];
}