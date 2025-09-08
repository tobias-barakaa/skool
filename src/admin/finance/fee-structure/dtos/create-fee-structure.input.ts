import { InputType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsUUID, MaxLength, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

@InputType({ description: 'Input type for creating fee structure items' })
export class CreateFeeStructureItemInput {
  @Field(() => ID, { description: 'The ID of the fee bucket' })
  @IsNotEmpty()
  @IsUUID()
  feeBucketId: string;

  @Field({ description: 'The amount for this fee item' })
  @IsNotEmpty()
  amount: number;

  @Field({ description: 'Whether this fee item is mandatory' })
  @IsNotEmpty()
  isMandatory: boolean;
}

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
  gradeLevelId: string;

  @Field(() => [CreateFeeStructureItemInput], { description: 'The fee items for this structure' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFeeStructureItemInput)
  items: CreateFeeStructureItemInput[];
}