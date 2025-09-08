import { InputType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID, IsArray } from 'class-validator';

@InputType({ description: 'Input type for creating a new fee assignment' })
export class CreateFeeAssignmentInput {
  @Field(() => ID, { description: 'The ID of the student' })
  @IsNotEmpty()
  @IsUUID()
  studentId: string;

  @Field(() => [ID], { description: 'The IDs of the fee structure items to assign' })
  @IsArray()
  @IsUUID('all', { each: true })
  feeStructureItemIds: string[];
}

@InputType({ description: 'Input type for bulk fee assignments' })
export class BulkFeeAssignmentInput {
  @Field(() => [ID], { description: 'The IDs of the students' })
  @IsArray()
  @IsUUID('all', { each: true })
  studentIds: string[];

  @Field(() => ID, { description: 'The ID of the fee structure to assign' })
  @IsNotEmpty()
  @IsUUID()
  feeStructureId: string;
}