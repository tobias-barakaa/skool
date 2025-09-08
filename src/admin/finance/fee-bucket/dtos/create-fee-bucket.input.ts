import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';

@InputType({ description: 'Input type for creating a new fee bucket' })
export class CreateFeeBucketInput {
  @Field({ description: 'The name of the fee bucket' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @Field({ nullable: true, description: 'Description of the fee bucket' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

@InputType({ description: 'Input type for updating a fee bucket' })
export class UpdateFeeBucketInput {
  @Field({ nullable: true, description: 'The name of the fee bucket' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @Field({ nullable: true, description: 'Description of the fee bucket' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @Field({ nullable: true, description: 'Whether the fee bucket is active' })
  @IsOptional()
  isActive?: boolean;
}