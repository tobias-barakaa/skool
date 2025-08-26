import { InputType, Field, ObjectType, ID } from '@nestjs/graphql';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';
import { Student } from 'src/admin/student/entities/student.entity';
import { Teacher } from 'src/admin/teacher/entities/teacher.entity';



@InputType()
export class SearchStudentInput {
  @Field()
  @IsString()
  name: string;
}

@InputType()
export class FilterInput {
  @Field(() => [ID], { nullable: true })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  tenantGradeLevelIds?: string[];

  @Field(() => [ID], { nullable: true })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  tenantSubjectIds?: string[];

  @Field(() => [ID], { nullable: true })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  streamIds?: string[];
}

@ObjectType()
export class SearchStudentResult {
  @Field(() => [Student])
  students: Student[];

  @Field()
  count: number;
}

@ObjectType()
export class SearchTeacherResult {
  @Field(() => [Teacher])
  teachers: Teacher[];

  @Field()
  count: number;
}

@ObjectType()
export class CombinedSearchResult {
  @Field(() => [Student])
  students: Student[];

  @Field(() => [Teacher])
  teachers: Teacher[];

  @Field()
  totalCount: number;
}

@ObjectType()
export class FilteredResult {
  @Field(() => [Student], { nullable: true })
  students?: Student[];

  @Field(() => [Teacher], { nullable: true })
  teachers?: Teacher[];

  @Field()
  totalCount: number;
}




