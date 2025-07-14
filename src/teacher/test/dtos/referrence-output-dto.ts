import { Field, InputType, ObjectType, Int } from '@nestjs/graphql';
import {
  IsString,
  IsNotEmpty,
  IsDate,
  IsInt,
  Min,
  IsUrl,
  IsOptional,
  IsEnum,
} from 'class-validator';


@ObjectType()
export class ReferenceMaterialOutput {
  @Field()
  @IsString()
  id: string;

  @Field()
  @IsUrl()
  fileUrl: string;

  @Field()
  @IsEnum(['pdf', 'doc', 'txt', 'image'])
  fileType: 'pdf' | 'doc' | 'txt' | 'image';

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  fileSize: number;

  @Field()
  @IsDate()
  createdAt: Date;
}
