import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsNumber,
  ValidateNested,
  IsString,
  ValidateIf
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateQuestionInput } from './create-question-input.dto';
import { CreateReferenceMaterialInput } from './referrence-input.dto';
import { ArrayMinSize } from 'class-validator';



@InputType()
export class CreateTestInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  title: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  subject: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  grade: string;

  @Field()
  @IsDateString()
  date: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  startTime: string;

  @Field(() => Int)
  @IsNumber()
  duration: number;

  @Field(() => Int)
  @IsNumber()
  totalMarks: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  resourceUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  instructions?: string;

  // Option 1: Allow empty array or undefined
  // @Field(() => [CreateQuestionInput], { nullable: true })
  // @IsOptional()
  // @ValidateNested({ each: true })
  // @Type(() => CreateQuestionInput)
  // questions?: CreateQuestionInput[];

  // Option 2: If you want to enforce non-empty when provided, use this instead:
  @Field(() => [CreateQuestionInput], { nullable: true })
  @IsOptional()
  @ValidateIf((o) => o.questions && o.questions.length > 0)
  @ArrayMinSize(1, { message: 'Questions array must not be empty when provided' })
  // @ValidateNested({ each: true })
  @Type(() => CreateQuestionInput)
  questions?: CreateQuestionInput[];

  @Field(() => [CreateReferenceMaterialInput], { nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateReferenceMaterialInput)
  referenceMaterials?: CreateReferenceMaterialInput[];
}


// @InputType()
// export class CreateTestInput {
//   @Field()
//   @IsNotEmpty()
//   @IsString()
//   title: string;

//   @Field()
//   @IsNotEmpty()
//   @IsString()
//   subject: string;

//   @Field()
//   @IsNotEmpty()
//   @IsString()
//   grade: string;

//   @Field()
//   @IsDateString()
//   date: string;

//   @Field()
//   @IsNotEmpty()
//   @IsString()
//   startTime: string;

//   @Field(() => Int)
//   @IsNumber()
//   duration: number;

//   @Field(() => Int)
//   @IsNumber()
//   totalMarks: number;

//   @Field({ nullable: true })
//   @IsOptional()
//   @IsString()
//   resourceUrl?: string;

//   @Field({ nullable: true })
//   @IsOptional()
//   @IsString()
//   instructions?: string;

//   // @Field(() => [CreateQuestionInput], { nullable: true })
//   // @IsOptional()
//   // @ValidateNested({ each: true })
//   // @Type(() => CreateQuestionInput)
//   // questions?: CreateQuestionInput[];

//   @Field(() => [CreateQuestionInput], { nullable: true })
//   @IsOptional()
//   @ValidateNested({ each: true })
//   @Type(() => CreateQuestionInput)
//   @ArrayMinSize(1, { message: 'Questions array must not be empty when provided' })
//   questions?: CreateQuestionInput[];

//   @Field(() => [CreateReferenceMaterialInput], { nullable: true })
//   @IsOptional()
//   @ValidateNested({ each: true })
//   @Type(() => CreateReferenceMaterialInput)
//   referenceMaterials?: CreateReferenceMaterialInput[];
// }


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
