import { InputType, Field, ID, ObjectType, Int } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsArray,
  ArrayNotEmpty,
  IsString,
  IsInt,
  Min,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { StudentFeeAssignment } from '../entities/student_fee_assignments.entity';
import { FeeAssignment } from '../entities/fee-assignment.entity';

@InputType({
  description: 'Input for retrieving fee assignments by specific tenant grade levels'
})
export class GetFeeAssignmentsByGradeLevelsInput {
  @Field(() => [ID], {
    description: 'Array of tenant grade level IDs to filter by'
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  tenantGradeLevelIds: string[];

  @Field(() => ID, {
    nullable: true,
    description: 'Optional fee structure ID to filter by specific fee structure'
  })
  @IsOptional()
  @IsUUID('4')
  feeStructureId?: string;
}

@ObjectType({
  description: 'Fee assignment with detailed student information and fee items'
})
export class FeeAssignmentWithStudents {
  @Field(() => FeeAssignment, { description: 'The fee assignment details' })
  @ValidateNested()
  @Type(() => FeeAssignment)
  feeAssignment: FeeAssignment;

  @Field(() => [StudentFeeAssignment], {
    description: 'All student assignments for this fee assignment'
  })
  @ValidateNested({ each: true })
  @Type(() => StudentFeeAssignment)
  studentAssignments: StudentFeeAssignment[];

  @Field(() => Int, { description: 'Total number of students assigned' })
  @IsInt()
  @Min(0)
  totalStudents: number;
}

@ObjectType({
  description: 'Complete fee assignment data for a tenant including all grade levels and students'
})
export class TenantFeeAssignmentSummary {
  @Field(() => ID, { description: 'The tenant ID' })
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @Field(() => [FeeAssignmentWithStudents], {
    description: 'All fee assignments for this tenant'
  })
  @ValidateNested({ each: true })
  @Type(() => FeeAssignmentWithStudents)
  feeAssignments: FeeAssignmentWithStudents[];

  @Field(() => Int, { description: 'Total number of fee assignments' })
  @IsInt()
  @Min(0)
  totalFeeAssignments: number;

  @Field(() => Int, {
    description: 'Total number of students with fee assignments'
  })
  @IsInt()
  @Min(0)
  totalStudentsWithFees: number;
}
