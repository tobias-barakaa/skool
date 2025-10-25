import { InputType, Field, ID } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { NoteVisibility } from '../entities/teacher-note.entity';

@InputType()
export class FilterTeacherNotesDto {
  @Field(() => ID, { nullable: true })
  @IsUUID()
  @IsOptional()
  subject_id?: string;

  @Field(() => ID, { nullable: true })
  @IsUUID()
  @IsOptional()
  grade_level_id?: string;

  @Field(() => NoteVisibility, { nullable: true })
  @IsEnum(NoteVisibility)
  @IsOptional()
  visibility?: NoteVisibility;

  @Field({ nullable: true })
  @IsOptional()
  is_ai_generated?: boolean;
}