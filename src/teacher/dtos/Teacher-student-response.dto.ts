import { Field, ID, ObjectType } from '@nestjs/graphql';
import { User } from 'src/admin/users/entities/user.entity';

@ObjectType()
export class TeacherStudentGradeDto {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  code: string;
}

@ObjectType()
export class TeacherStudentStreamDto {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;
}

@ObjectType()
export class TeacherStudentResponse {
  @Field(() => ID)
  id: string;

  @Field()
  admission_number: string;

  @Field()
  phone: string;

  @Field()
  gender: string;

  @Field()
  feesOwed: number;

  @Field()
  totalFeesPaid: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => TeacherStudentGradeDto, { nullable: true })
  // grade: TeacherStudentGradeDto;
  grade: TeacherStudentGradeDto | null;

  @Field(() => TeacherStudentStreamDto, { nullable: true })
  // stream: TeacherStudentStreamDto;
  stream: {
    id: string;
    name: string;
  } | null;


  // If you need the raw IDs as well
  @Field(() => ID, { nullable: true })
  // grade_level_id: string;
  grade_level_id: string | null;

  @Field(() => ID, { nullable: true })
  streamId: string | null;


  @Field(() => User, { nullable: true })
  user: User | null;
}