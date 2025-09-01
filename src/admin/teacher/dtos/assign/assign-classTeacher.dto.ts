import { InputType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

@InputType()
export class AssignClassTeacherInput {
  @Field(() => ID)
  
  @IsNotEmpty()
  @IsUUID()
  teacherId: string;

  @Field(() => ID, { nullable: true })
  @IsUUID()
  @IsOptional()
  streamId?: string;

  @Field(() => ID, { nullable: true })
  @IsUUID()
  @IsOptional()
  gradeLevelId?: string;
}

@InputType()
export class UnassignClassTeacherInput {
  @Field(() => ID)
  @IsNotEmpty()
  @IsUUID()
  teacherId: string;
}






