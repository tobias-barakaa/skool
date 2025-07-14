import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateQuestionInput } from './create-question-input.dto';
import { CreateReferenceMaterialInput } from './referrence-input.dto';


@InputType()
export class CreateTestInput {
  @Field()
  @IsNotEmpty()
  title: string;

  @Field()
  @IsNotEmpty()
  subject: string;

  @Field()
  @IsNotEmpty()
  grade: string;

  @Field()
  @IsDateString()
  date: string;

  @Field()
  @IsNotEmpty()
  startTime: string;

  @Field(() => Int)
  @IsNumber()
  duration: number;

  @Field(() => Int)
  @IsNumber()
  totalMarks: number;

  @Field({ nullable: true })
  @IsOptional()
  resourceUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  instructions?: string;

  @Field(() => [CreateQuestionInput], { nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionInput)
  questions?: CreateQuestionInput[];

  @Field(() => [CreateReferenceMaterialInput], { nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateReferenceMaterialInput)
  referenceMaterials?: CreateReferenceMaterialInput[];
}


// import { Field, InputType, ObjectType, Int } from '@nestjs/graphql';
// import {
//   IsString,
//   IsNotEmpty,
//   IsDate,
//   IsInt,
//   Min,
//   IsUrl,
//   IsOptional,
//   IsEnum,
// } from 'class-validator';

// @InputType()
// export class CreateTestInput {
//   @Field()
//   @IsString()
//   @IsNotEmpty()
//   title: string;

//   @Field()
//   @IsString()
//   @IsNotEmpty()
//   subject: string;

//   @Field()
//   @IsString()
//   @IsNotEmpty()
//   grade: string;

//   @Field()
//   @IsDate()
//   @IsNotEmpty()
//   date: Date;

//   @Field()
//   @IsString()
//   @IsNotEmpty()
//   startTime: string;

//   @Field(() => Int)
//   @IsInt()
//   @Min(1)
//   duration: number;

//   @Field(() => Int)
//   @IsInt()
//   @Min(1)
//   totalMarks: number;

//   @Field({ nullable: true })
//   @IsOptional()
//   @IsUrl()
//   resourceUrl?: string;

//   @Field({ nullable: true })
//   @IsOptional()
//   @IsString()
//   instructions?: string;

//   @Field()
//   @IsString()
//   @IsNotEmpty()
//   tenantId: string;
// }
