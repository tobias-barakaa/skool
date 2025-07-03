import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class TeacherDto {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field()
  tenantId: string;

  @Field({ nullable: true })
  userId?: string;
}
