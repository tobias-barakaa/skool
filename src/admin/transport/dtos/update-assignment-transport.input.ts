import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsOptional, IsString } from 'class-validator';

  
  @InputType()
  export class UpdateTransportAssignmentInput {
    @Field(() => ID, { description: 'Transport assignment ID to update' })
    @IsUUID(4, { message: 'Assignment ID must be a valid UUID' })
    assignmentId: string;
  
    @Field(() => ID, { 
      nullable: true, 
      description: 'New transport route ID (optional - for changing routes)' 
    })
    @IsOptional()
    @IsUUID(4, { message: 'New route ID must be a valid UUID' })
    newRouteId?: string;
  
    @Field({ nullable: true, description: 'Updated pickup point (optional)' })
    @IsOptional()
    @IsString()
    pickupPoint?: string;
  }
