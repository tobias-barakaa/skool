import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsOptional, IsArray, IsString, ArrayMinSize, IsEnum } from 'class-validator';

@InputType()
export class AssignTransportInput {
  @Field(() => ID, { description: 'Student ID to assign to transport route' })
  @IsUUID(4, { message: 'Student ID must be a valid UUID' })
  studentId: string;

  @Field(() => ID, { description: 'Transport route ID to assign student to' })
  @IsUUID(4, { message: 'Route ID must be a valid UUID' })
  routeId: string;

  @Field({ nullable: true, description: 'Pickup point location (optional)' })
  @IsOptional()
  @IsString()
  pickupPoint?: string;
}

// @InputType()
// export class BulkTransportAssignmentInput {
//   @Field(() => ID, { description: 'Transport route ID to assign students to' })
//   @IsUUID(4, { message: 'Route ID must be a valid UUID' })
//   routeId: string;

//   @Field(() => [ID], { 
//     nullable: true, 
//     description: 'Array of student IDs to assign. If empty, assigns all students in tenant' 
//   })
//   @IsOptional()
//   @IsArray()
//   @IsUUID(4, { each: true, message: 'All student IDs must be valid UUIDs' })
//   studentIds?: string[];

//   @Field({ nullable: true, description: 'Common pickup point for all students (optional)' })
//   @IsOptional()
//   @IsString()
//   pickupPoint?: string;
// }

@InputType()
export class RemoveTransportAssignmentInput {
  @Field(() => ID, { description: 'Student ID to remove from transport route' })
  @IsUUID(4, { message: 'Student ID must be a valid UUID' })
  studentId: string;

  @Field(() => ID, { description: 'Transport route ID to remove student from' })
  @IsUUID(4, { message: 'Route ID must be a valid UUID' })
  routeId: string;
}

@InputType()
export class BulkRemoveTransportAssignmentInput {
  @Field(() => [ID], { description: 'Array of student IDs to remove from transport routes' })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one student ID must be provided' })
  @IsUUID(4, { each: true, message: 'All student IDs must be valid UUIDs' })
  studentIds: string[];

  @Field(() => ID, { 
    nullable: true, 
    description: 'Specific route ID to remove from. If not provided, removes from all routes' 
  })
  @IsOptional()
  @IsUUID(4, { message: 'Route ID must be a valid UUID' })
  routeId?: string;
}


@InputType()
export class GetTransportAssignmentsInput {
  @Field(() => ID, { nullable: true, description: 'Filter by specific route ID' })
  @IsOptional()
  @IsUUID(4, { message: 'Route ID must be a valid UUID' })
  routeId?: string;

  @Field(() => ID, { nullable: true, description: 'Filter by specific student ID' })
  @IsOptional()
  @IsUUID(4, { message: 'Student ID must be a valid UUID' })
  studentId?: string;

  @Field({ nullable: true, description: 'Filter by assignment status' })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE'], { message: 'Status must be either ACTIVE or INACTIVE' })
  status?: 'ACTIVE' | 'INACTIVE';

  @Field({ nullable: true, description: 'Number of records to return (pagination)' })
  @IsOptional()
  limit?: number;

  @Field({ nullable: true, description: 'Number of records to skip (pagination)' })
  @IsOptional()
  offset?: number;
}