import { InputType, Field, ID, PartialType } from '@nestjs/graphql';

import { IsOptional, IsBoolean } from 'class-validator';
import { CreateFeeAssignmentInput } from './assignment-structure.input';

@InputType({
  description: 'Input for updating a fee assignment'
})
export class UpdateFeeAssignmentInput extends PartialType(CreateFeeAssignmentInput) {
  @Field({
    nullable: true,
    description: 'Whether the assignment is active'
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field({
    nullable: true,
    description: 'Updated description or notes'
  })
  @IsOptional()
  description?: string;
}