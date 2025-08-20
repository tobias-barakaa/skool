// src/tests/dto/create-test.input.ts
import { Field, GraphQLISODateTime, ID, InputType, Int } from '@nestjs/graphql';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
  ArrayMinSize,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateQuestionInput } from './create-question-input.dto';
import { CreateReferenceMaterialInput } from './referrence-input.dto';

@InputType()
export class CreateTestInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  title: string;

  /* tenant-level subject id (UUID) */
  @Field(() => ID)
  @IsUUID()
  tenantSubjectId: string;

  @Field(() => GraphQLISODateTime)
  @IsDate()
  date: Date;

  @Field()
  @IsNotEmpty()
  @IsString()
  startTime: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  endTime?: string;

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

  /* tenant-level grade level ids */
  @Field(() => [ID])
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  tenantGradeLevelIds: string[];

  /* optional nested questions */
  @Field(() => [CreateQuestionInput], { nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionInput)
  questions?: CreateQuestionInput[];

  /* optional nested reference materials */
  @Field(() => [CreateReferenceMaterialInput], { nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateReferenceMaterialInput)
  referenceMaterials?: CreateReferenceMaterialInput[];
}

// // src/tests/dto/create-test.input.ts
// @InputType()
// export class CreateTestInput {
//     @Field()
//     @IsNotEmpty()
//     @IsString()
//     title: string;

//   @Field(() => ID)
//   tenantSubjectId: string;

//   @Field(() => [ID])
//   tenantGradeLevelIds: string[];

//   @Field()
//   date: Date;

//   @Field()
//   startTime: string;

//   @Field({ nullable: true })
//   endTime?: string;

//   @Field()
//   duration: number;

//   @Field()
//   totalMarks: number;

//   @Field({ nullable: true })
//   resourceUrl?: string;

//   @Field({ nullable: true })
//   instructions?: string;

//   /* optional nested questions & reference materials */
//   @Field(() => [QuestionInput], { nullable: true })
//   questions?: QuestionInput[];

//   @Field(() => [ReferenceMaterialInput], { nullable: true })
//   referenceMaterials?: ReferenceMaterialInput[];
// }

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
