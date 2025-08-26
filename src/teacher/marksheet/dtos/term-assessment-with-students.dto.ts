import { ObjectType, Field } from '@nestjs/graphql';
import { Assessment } from '../assessment/entity/assessment.entity';
import { Student } from 'src/admin/student/entities/student.entity';

@ObjectType()
export class TermAssessmentWithStudentsDto {
  @Field(() => [Assessment])
  assessments: Assessment[];

  @Field(() => [Student])
  students: Student[];
}
