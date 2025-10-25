import { InputType, Field, ID } from '@nestjs/graphql';
import { IsString, IsEnum, IsOptional, IsBoolean, IsArray, IsUUID, MaxLength } from 'class-validator';
import { NoteVisibility } from '../entities/teacher-note.entity';

@InputType()
export class CreateTeacherNoteDto {
  @Field()
  @IsString()
  @MaxLength(255)
  title: string;

  @Field()
  @IsString()
  content: string;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  links?: string[];

  @Field(() => ID, { nullable: true })
  @IsUUID()
  @IsOptional()
  subject_id?: string;

  @Field(() => ID, { nullable: true })
  @IsUUID()
  @IsOptional()
  grade_level_id?: string;

  @Field(() => NoteVisibility)
  @IsEnum(NoteVisibility)
  visibility: NoteVisibility;

  @Field({ nullable: true, defaultValue: false })
  @IsBoolean()
  @IsOptional()
  is_ai_generated?: boolean;
}