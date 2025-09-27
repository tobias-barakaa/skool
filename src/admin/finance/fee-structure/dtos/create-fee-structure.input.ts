import { InputType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsUUID, MaxLength, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

@InputType({ description: 'Input type for creating a new fee structure' })
export class CreateFeeStructureInput {
  @Field({ description: 'The name of the fee structure' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  name: string;

  @Field(() => String, { description: 'The ID of the academic year' })
  @IsNotEmpty()
  @IsUUID()
  academicYearId: string;


  @Field(() => [String], { description: 'The IDs of the terms' })
@IsNotEmpty()
@IsArray()
@IsUUID('4', { each: true })
termIds: string[];

  @Field(() => [String], { 
    description: 'Array of grade level IDs this fee structure applies to',
    nullable: true 
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  gradeLevelIds?: string[];


}

// import { InputType, Field, ID } from '@nestjs/graphql';
// import { IsNotEmpty, IsString, IsUUID, MaxLength, IsArray, ValidateNested } from 'class-validator';
// import { Type } from 'class-transformer';


// @InputType({ description: 'Input type for creating a new fee structure' })
// export class CreateFeeStructureInput {
//   @Field({ description: 'The name of the fee structure' })
//   @IsNotEmpty()
//   @IsString()
//   @MaxLength(200)
//   name: string;

//   @Field(() => String, { description: 'The ID of the academic year' })
//   @IsNotEmpty()
//   @IsUUID()
//   academicYearId: string;


//   @Field(() => String, { description: 'The ID of the term' })
// @IsNotEmpty()
// @IsUUID()
// termId: string;

// }