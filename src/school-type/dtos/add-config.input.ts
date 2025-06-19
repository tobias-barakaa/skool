// DTO Input
import { InputType, Field } from '@nestjs/graphql';
import { IsArray, IsOptional, IsString } from 'class-validator';

@InputType()
export class AddCBCConfigInput {
  @Field(() => [String])
  @IsArray()
  @IsString({ each: true })
  levels: string[]; 

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  schoolDomain?: string; 
}