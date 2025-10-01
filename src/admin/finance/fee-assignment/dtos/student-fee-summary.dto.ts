import { ObjectType, Field, Float, ID } from '@nestjs/graphql';

@ObjectType()
export class StudentFeeItemSummary {
  @Field(() => ID)
  id: string;

  @Field()
  bucketName: string;

  @Field(() => Float)
  amount: number;

  @Field()
  isMandatory: boolean;
}

@ObjectType()
export class StudentFeeSummary {
  @Field(() => ID)
  studentId: string;

  @Field()
  studentName: string;

  @Field()
  admissionNumber: string;

  @Field()
  gradeLevel: string;

  @Field(() => String, { nullable: true })
feeStructureName: string | null;

  @Field()
  academicYear: string;

  @Field(() => [String])
  terms: string[];

  @Field(() => Float)
  totalAmount: number;

  @Field(() => [StudentFeeItemSummary])
  items: StudentFeeItemSummary[];
}
