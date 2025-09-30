import {  IsNumber, Min, IsBoolean,  } from 'class-validator';

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
// }

// dtos/create-fee-structure-with-items.input.ts
// import { Field, InputType } from '@nestjs/graphql';
// import { IsString, IsUUID, IsArray, ArrayMinSize, ValidateNested, IsOptional } from 'class-validator';
// import { Type } from 'class-transformer';
// import { CreateFeeStructureItemInput } from '../../fee-structure-item/dtos/create-fee-structure-item.dto';

// @InputType()
// export class CreateFeeStructureWithItemsInput {
//   @Field()
//   @IsString()
//   name: string;

//   @Field()
//   @IsUUID()
//   academicYearId: string;

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

//   @Field(() => [CreateFeeStructureItemInput], { nullable: true })
//   @IsArray()
//   @IsOptional()
//   @ValidateNested({ each: true })
//   @Type(() => FeeStructureItemInput)
//   items?: FeeStructureItemInput[];
// }

// ============================================
// 2. Entity Updates
// ============================================

// entities/fee-structure.entity.ts (add these relations if not present)


// entities/fee-structure-item.entity.ts

// import { InputType, Field, ID } from '@nestjs/graphql';
// import { IsNotEmpty, IsString, IsUUID, MaxLength, IsArray, ValidateNested, IsOptional } from 'class-validator';
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


//   @Field(() => [String], { description: 'The IDs of the terms' })
// @IsNotEmpty()
// @IsArray()
// @IsUUID('4', { each: true })
// termIds: string[];

//   @Field(() => [String], { 
//     description: 'Array of grade level IDs this fee structure applies to',
//     nullable: true 
//   })
//   @IsOptional()
//   @IsArray()
//   @IsUUID('4', { each: true })
//   gradeLevelIds?: string[];


// }

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