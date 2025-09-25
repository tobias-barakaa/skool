import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
class StudentForParentDto {
  @Field(() => ID)
  id: string;

  @Field()
  admissionNumber: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  grade: string;

  @Field()
  relationship: string;

  @Field()
  isPrimary: boolean;
}

@ObjectType()
export class ParentDto {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field()
  phone: string;

  @Field(() => String, { nullable: true })  
address?: string | null;

@Field(() => String, { nullable: true })
occupation?: string | null;

  @Field()
  isActive: boolean;

  @Field({ nullable: true })
  userId?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [StudentForParentDto])
  students: StudentForParentDto[];
}