import { InputType, Field, PartialType } from '@nestjs/graphql';
import { CreateFeeStructureInput } from './create-fee-structure.input';
import { IsBoolean, IsOptional } from 'class-validator';

@InputType()
export class UpdateFeeStructureInput extends PartialType(CreateFeeStructureInput) {
  @Field({ nullable: true })
  @IsOptional()      
  @IsBoolean()      
  isActive?: boolean;
}


