import { InputType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsUUID, MaxLength, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';


@InputType({ description: 'Input type for creating a new fee structure' })
export class CreateFeeStructureInput {
  @Field({ description: 'The name of the fee structure' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  name: string;

  @Field(() => ID, { description: 'The ID of the academic year' })
  @IsNotEmpty()
  @IsUUID()
  academicYearId: string;

  @Field(() => ID, { description: 'The ID of the term' })
  @IsNotEmpty()
  @IsUUID()
  termId: string;

  @Field(() => ID, { description: 'The ID of the grade level' })
  @IsNotEmpty()
  @IsUUID()
  tenantGradeLevelId: string;

}