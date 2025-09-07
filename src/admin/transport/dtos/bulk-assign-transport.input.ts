import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsOptional, IsArray, IsString } from 'class-validator';

@InputType()
export class BulkTransportAssignmentInput {
    @Field(() => ID, { description: 'Transport route ID to assign students to' })
    @IsUUID(4, { message: 'Route ID must be a valid UUID' })
    routeId: string;
  
    @Field(() => [ID], { 
      nullable: true, 
      description: 'Array of student IDs to assign. If empty, assigns all students in tenant' 
    })
    @IsOptional()
    @IsArray()
    @IsUUID(4, { each: true, message: 'All student IDs must be valid UUIDs' })
    studentIds?: string[];
  
    @Field({ nullable: true, description: 'Common pickup point for all students (optional)' })
    @IsOptional()
    @IsString()
    pickupPoint?: string;
  }
