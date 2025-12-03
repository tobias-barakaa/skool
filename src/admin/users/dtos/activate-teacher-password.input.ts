import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType()
export class ActivateTeacherInput {
    @Field()
    @IsNotEmpty({ message: 'Teacher ID is required' })
    @IsUUID('4', { message: 'Teacher ID must be a valid UUID' })
    teacherId: string;
}

@ObjectType()
export class ActivateTeacherOutput {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field({ nullable: true })
  email?: string;
};


@ObjectType()
export class StudentCredentials {
  @Field()
  email: string;

  @Field()
  password: string;

  @Field({ nullable: true })
  name?: string;
};


