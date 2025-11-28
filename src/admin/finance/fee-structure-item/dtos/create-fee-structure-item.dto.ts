import { InputType, Field, Float, ID } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsUUID, IsNumber, Min, IsBoolean, IsOptional, IsString, IsArray, ArrayMinSize, ValidateNested } from 'class-validator';

@InputType()
export class FeeStructureItemInput {
  @Field(() => ID)
  @IsUUID()
  feeBucketId: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0, { message: 'Amount must be greater than or equal to 0' })
  amount: number;

  @Field({ defaultValue: true })
  @IsBoolean()
  @IsOptional()
  isMandatory?: boolean = true;

  // CHANGED: Array of term IDs
  @Field(() => [ID])
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one term must be specified' })
  @IsUUID('4', { each: true })
  termIds: string[];
}

@InputType()
export class CreateFeeStructureWithItemsInput {
  termIds(termIds: any) {
    throw new Error('Method not implemented.');
  }
  @Field()
  @IsString()
  name: string;

  @Field(() => ID)
  @IsUUID()
  academicYearId: string;

  @Field(() => [ID], { nullable: true })
  @IsArray()
  @IsOptional()
  @IsUUID('4', { each: true })
  gradeLevelIds?: string[];

  @Field(() => [FeeStructureItemInput], { nullable: true })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FeeStructureItemInput)
  items?: FeeStructureItemInput[];
}

// // import { InputType, Field, Float, ID } from '@nestjs/graphql';
// // import { IsUUID, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';

// // @InputType({ description: 'Input for creating a new fee structure item' })
// // export class CreateFeeStructureItemInput {
// //   @Field(() => ID, { description: 'The ID of the fee structure' })
// //   @IsUUID('4', { message: 'Fee structure ID must be a valid UUID' })
// //   feeStructureId: string;

// //   @Field(() => ID, { description: 'The ID of the fee bucket' })
// //   @IsUUID('4', { message: 'Fee bucket ID must be a valid UUID' })
// //   feeBucketId: string;

// //   @Field(() => Float, { description: 'The amount for this fee item' })
// //   @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Amount must be a valid number with at most 2 decimal places' })
// //   @Min(0, { message: 'Amount must be greater than or equal to 0' })
// //   amount: number;

// //   @Field({ description: 'Indicates if this fee item is mandatory', defaultValue: true })
// //   @IsBoolean({ message: 'isMandatory must be a boolean value' })
// //   @IsOptional()
// //   isMandatory?: boolean;
// // }


// import { InputType, Field, Float, ID } from '@nestjs/graphql';
// import { Type } from 'class-transformer';
// import { IsUUID, IsNumber, Min, IsBoolean, IsOptional, IsString, IsArray, ArrayMinSize, ValidateNested } from 'class-validator';

// @InputType()
// export class FeeStructureItemInput {
//   @Field()
//   @IsUUID()
//   feeBucketId: string;


//   @Field(() => Float)
//   @IsNumber()
//   @Min(0, { message: 'Amount must be greater than or equal to 0' })
//   amount: number;

//   @Field({ defaultValue: true })
//   @IsBoolean()
//   @IsOptional()
//   isMandatory?: boolean = true;


// @Field(() => String)
// @IsUUID()
// termId: string;
// }




// @InputType()
// export class CreateFeeStructureWithItemsInput {
//   @Field()
//   @IsString()
//   name: string;

//   @Field()
//   @IsUUID()
//   academicYearId: string;


//   // @Field(() => ID)  
//   // @IsUUID()
//   // termId: string;

//   @Field(() => [String])
//   @IsArray()
//   @ArrayMinSize(1)
//   @IsUUID('4', { each: true })
//   termIds: string[];

//   @Field(() => [String], { nullable: true })
//   @IsArray()
//   @IsOptional()
//   @IsUUID('4', { each: true })
//   gradeLevelIds?: string[];

//   @Field(() => [FeeStructureItemInput], { nullable: true })
//   @IsArray()
//   @IsOptional()
//   @ValidateNested({ each: true })
//   @Type(() => FeeStructureItemInput)
//   items?: FeeStructureItemInput[];
// }
