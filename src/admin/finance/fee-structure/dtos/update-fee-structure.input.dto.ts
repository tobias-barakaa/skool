import { InputType, Field, PartialType } from '@nestjs/graphql';
import { CreateFeeStructureInput } from './create-fee-structure.input';
import { IsArray, IsBoolean, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

@InputType()
export class UpdateFeeStructureInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  gradeLevelIds?: string[];
}
