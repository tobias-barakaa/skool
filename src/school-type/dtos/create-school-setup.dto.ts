import { IsArray, IsString, IsOptional, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InputType, Field, ObjectType } from '@nestjs/graphql';

@InputType('CBCLevelSelectionInput') 
@ObjectType()
export class CBCLevelSelectionDto {
    @Field()
    @IsString()
    levelKey: string;
  
    @Field(() => [String])
    @IsArray()
    selectedGrades: string[];
  
    @Field(() => [String])
    @IsArray()
    selectedSubjects: string[];
}

@InputType()
export class CreateSchoolSetupDto {
  @Field()
  @IsString()
  schoolName: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => [CBCLevelSelectionDto])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CBCLevelSelectionDto)
  selectedLevels: CBCLevelSelectionDto[];

  @Field()
  @IsString()
  createdBy: string;

  
}