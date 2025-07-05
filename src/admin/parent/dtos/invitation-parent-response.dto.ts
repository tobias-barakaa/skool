import { InputType, Field, ID, ObjectType } from '@nestjs/graphql';
import { Student } from 'src/admin/student/entities/student.entity';


@ObjectType()
export class InvitationResponse {
  @Field()
  email: string;

  @Field()
  fullName: string;

  @Field()
  status: string;

  @Field()
  createdAt: Date;

  @Field()
  linkedStudents: number;
}

@ObjectType()
export class StudentSearchResult {
  @Field(() => [Student])
  exactMatches: Student[];

  @Field(() => [Student])
  similarMatches: Student[];
}
