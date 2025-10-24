import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

@InputType()
export class SendMessageFromStudentToTeacherInput {
  @Field()
  @IsNotEmpty()
  @IsUUID()
  recipientId: string; // Teacher userId

  @Field()
  @IsNotEmpty()
  recipientType: string; // Always "TEACHER"

  @Field()
  @IsNotEmpty()
  @IsUUID()
  studentId: string; // Child/student reference

  @Field({ nullable: true })
  @IsOptional()
  subject?: string;

  @Field()
  @IsNotEmpty()
  message: string;

  @Field({ nullable: true })
  @IsOptional()
  imageUrl?: string;
}
