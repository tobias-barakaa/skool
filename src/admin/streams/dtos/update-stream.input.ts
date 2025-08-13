import { InputType, Field, ID, PartialType } from '@nestjs/graphql';
import { IsOptional, IsString, IsBoolean, IsNumber, Min, IsUUID } from 'class-validator';

@InputType()
export class UpdateStreamInput {
  @Field(() => ID)
  @IsUUID()
  id: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  capacity?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  gradeLevelId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}




@InputType()
export class UpdateTenantStreamInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  /* add any other tenant-specific overrides you need, e.g. capacity */
}
