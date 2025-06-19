import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType('SchoolTypeGrade')
export class SchoolTypeGrade {
  @Field()
  name: string;

  @Field()
  age: number;
}

@ObjectType('SchoolTypeLevel')
export class SchoolTypeLevel {
  @Field()
  name: string;

  @Field()
  description: string;

  @Field(() => [SchoolTypeGrade])
  grades: SchoolTypeGrade[];
}

@ObjectType()
export class SchoolTypeConfig {
  @Field()
  type: string;

  @Field()
  name: string;

  @Field()
  description: string;

  @Field()
  icon: string;

  @Field()
  priority: number;

  @Field(() => [String])
  menuItems: string[];

  @Field(() => [SchoolTypeLevel])
  levels: SchoolTypeLevel[];
}

