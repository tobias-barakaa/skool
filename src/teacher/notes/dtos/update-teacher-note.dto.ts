import { InputType, Field, ID, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateTeacherNoteDto } from './create-teacher-note.dto';

@InputType()
export class UpdateTeacherNoteDto extends PartialType(CreateTeacherNoteDto) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}