import { InputType, Field, registerEnumType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsEnum, Min, IsString } from 'class-validator';

export enum SubjectTypeEnum {
  CORE = 'core',
  ELECTIVE = 'elective'
}

registerEnumType(SubjectTypeEnum, {
  name: 'SubjectTypeEnum',
});

@InputType()
export class CreateTenantSubjectInput {
  @Field()
  @IsNotEmpty()
  curriculumId: string;

  @Field()
  @IsNotEmpty()
  subjectId: string;

  @Field(() => SubjectTypeEnum, { nullable: true })
  @IsOptional()
  @IsEnum(SubjectTypeEnum)
  subjectType?: SubjectTypeEnum;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isCompulsory?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalMarks?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  passingMarks?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  creditHours?: number;
}

@InputType()
export class UpdateTenantSubjectInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  code?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  shortName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  category?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  department?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEnum(SubjectTypeEnum)
  subjectType?: SubjectTypeEnum;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  isCompulsory?: boolean;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  totalMarks?: number;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  passingMarks?: number;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  creditHours?: number;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  isActive?: boolean;
}
