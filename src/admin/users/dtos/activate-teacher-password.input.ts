import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@InputType()
export class ActivateTeacherInput {
  @Field()
  @IsUUID()
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
}