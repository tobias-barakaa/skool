import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class ParentInfo {
  @Field(() => ID)
  parentId: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field()
  phone: string;

  @Field()
  relationship: string;

  @Field()
  isPrimary: boolean;
}

@ObjectType()
export class StudentWithParentsType {
  @Field(() => ID)
  studentId: string;

  @Field()
  admissionNumber: string;

  @Field(() => [ParentInfo])
  parents: ParentInfo[];
}
