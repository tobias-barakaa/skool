import { ObjectType, Field, ID, InputType, Int } from '@nestjs/graphql';
import { IsArray, IsString, IsOptional, IsUUID } from 'class-validator';

// Grade DTO
@ObjectType()
export class GradeType {
  @Field()
  name: string;

  @Field(() => Int)
  age: number;
}


// Level DTO
@ObjectType()
export class LevelType {
  @Field()
  name: string;

  @Field()
  description: string;

  @Field(() => [GradeType])
  grades: GradeType[];
}



@ObjectType()
export class CBCSchoolSelection {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => [String])
  selectedLevels: string[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}



// Input for creating CBC selection
@InputType()
export class CreateCBCSelectionInput {
  @Field(() => [String])
  @IsArray()
  @IsString({ each: true })
  selectedLevels: string[]; // Array of level keys: ["pre-primary", "lower-primary", etc.]

  @Field(() => ID)
  @IsUUID()
  userId: string;

  @Field(() => [String])
  selectedSubjects: string[];
}


// Input for updating CBC selection
@InputType()
export class UpdateCBCSelectionInput {
  @Field(() => ID)
  @IsUUID()
  id: string;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  selectedLevels?: string[];
}