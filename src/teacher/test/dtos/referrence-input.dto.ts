import { Field, InputType, ObjectType, Int } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
} from 'class-validator';

@InputType()
export class CreateReferenceMaterialInput {
  @Field()
  @IsNotEmpty()
  fileUrl: string;

  @Field()
  @IsEnum(['pdf', 'doc', 'txt', 'image'])
  fileType: 'pdf' | 'doc' | 'txt' | 'image';

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  fileSize?: number;
}

// @InputType()
// export class ReferenceMaterialInput {
//   @Field()
//   @IsUrl()
//   @IsNotEmpty()
//   fileUrl: string;

//   @Field()
//   @IsEnum(['pdf', 'doc', 'txt', 'image'])
//   @IsNotEmpty()
//   fileType: 'pdf' | 'doc' | 'txt' | 'image';

//   @Field(() => Int, { nullable: true })
//   @IsOptional()
//   @IsInt()
//   @Min(0)
//   @Max(10000000) // 10MB max
//   fileSize: number;
// }
