import { InputType, Field, Int } from '@nestjs/graphql';
import { IsString, IsOptional, IsBoolean, IsUUID, IsInt, Min, MaxLength } from 'class-validator';

@InputType()
export class CreateStreamInput {
  @Field()
  @IsString()
  @MaxLength(100)
  name: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true, defaultValue: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field()
  @IsUUID()
  gradeLevelId: string;
}




@InputType()
export class CreateTenantStreamInput {
  @Field()
  @IsString()
  name: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field()
  @IsUUID()
  tenantGradeLevelId: string;
}
