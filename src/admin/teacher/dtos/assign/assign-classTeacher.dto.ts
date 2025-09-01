import { InputType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

@InputType()
export class AssignStreamClassTeacherInput {
  @Field(() => ID)
  @IsNotEmpty()
  @IsUUID()
  teacherId: string;

  @Field(() => ID)
  @IsNotEmpty()
  @IsUUID()
  streamId: string;
}

@InputType()
export class AssignGradeLevelClassTeacherInput {
  @Field(() => ID)
  @IsNotEmpty()
  @IsUUID()
  teacherId: string;

  @Field(() => ID)
  @IsNotEmpty()
  @IsUUID()
  gradeLevelId: string;
}

@InputType()
export class UnassignClassTeacherInput {
  @Field(() => ID)
  @IsNotEmpty()
  @IsUUID()
  teacherId: string;
}






