import { ObjectType, Field, ID, GraphQLISODateTime } from '@nestjs/graphql';

@ObjectType()
export class TeacherDto {
  @Field(() => ID)
  id: string;

  @Field()
  fullName: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  email: string;

  @Field()
  phoneNumber: string;

  @Field()
  gender: string;

  @Field()
  department: string;

  @Field({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  subject?: string;

  @Field({ nullable: true })
  employeeId?: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  dateOfBirth?: Date;

  @Field()
  isActive: boolean;

  @Field()
  hasCompletedProfile: boolean;

  @Field()
  tenantId: string;

  @Field({ nullable: true })
  userId?: string;
}
