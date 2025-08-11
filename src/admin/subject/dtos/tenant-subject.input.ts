import { InputType, Field, registerEnumType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsEnum, Min } from 'class-validator';

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
