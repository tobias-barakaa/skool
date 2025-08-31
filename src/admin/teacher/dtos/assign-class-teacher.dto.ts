import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class AssignClassTeacherInput {
  @Field(() => ID)
  teacherId: string;

  @Field(() => ID, { nullable: true })
  streamId?: string;

  @Field(() => ID, { nullable: true })
  gradeLevelId?: string;

  @Field(() => ID)
  tenantId: string;
}

@InputType()
export class UnassignClassTeacherInput {
  @Field(() => ID)
  teacherId: string;

  @Field(() => ID)
  tenantId: string;
}
