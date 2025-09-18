
import { InputType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsArray, IsUUID, ArrayNotEmpty, IsOptional, IsBoolean, IsString } from 'class-validator';

@InputType({
  description: 'Input for creating a new fee assignment'
})
export class CreateFeeAssignmentInput {
  @Field(() => ID, {
    description: 'The ID of the fee structure to assign'
  })
  @IsNotEmpty()
  @IsUUID()
  feeStructureId: string;

  @Field(() => [ID], { description: 'Array of tenant grade level IDs (not grade level IDs)' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(4, { each: true })
  tenantGradeLevelIds: string[];

 
  @Field({
    nullable: true,
    description: 'Optional description or notes about this assignment'
  })
  @IsOptional()
  @IsString()   
  description?: string;


}



// import { InputType, Field, ID, Float } from '@nestjs/graphql';
// import { IsUUID, IsArray, ArrayNotEmpty, IsOptional, IsBoolean, IsNumber, Min, IsString, MaxLength } from 'class-validator';

// @InputType()
// export class AssignFeeStructureInput {
//   @Field(() => ID, { description: 'The ID of the fee structure to assign' })
//   @IsUUID()
//   feeStructureId: string;

//   @Field(() => [ID], { description: 'Array of grade level IDs to assign the fee structure to' })
//   @IsArray()
//   @ArrayNotEmpty()
//   @IsUUID(4, { each: true })
//   gradeLevelIds: string[];

//   @Field({ nullable: true, description: 'Optional notes about this bulk assignment' })
//   @IsOptional()
//   @IsString()
//   @MaxLength(500)
//   notes?: string;
// }

// @InputType()
// export class UpdateStudentFeeItemInput {
//   @Field(() => ID, { description: 'The ID of the student fee item to update' })
//   @IsUUID()
//   id: string;

//   @Field(() => Boolean, { nullable: true, description: 'Whether the fee item is active' })
//   @IsOptional()
//   @IsBoolean()
//   isActive?: boolean;

//   @Field(() => Float, { nullable: true, description: 'The amount for the fee item' })
//   @IsOptional()
//   @IsNumber()
//   @Min(0)
//   amount?: number;
// }

// @InputType()
// export class UpdateFeeAssignmentInput {
//   @Field(() => ID, { description: 'The ID of the fee assignment to update' })
//   @IsUUID()
//   id: string;

//   @Field(() => Boolean, { nullable: true, description: 'Whether the assignment is active' })
//   @IsOptional()
//   @IsBoolean()
//   isActive?: boolean;
// }