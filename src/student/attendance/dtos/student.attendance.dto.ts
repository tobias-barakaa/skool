import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class AttendanceRecordSummary {
  @Field()
  date: string;

  @Field()
  status: string;

  @Field({ nullable: true })
  remark?: string;
}

@ObjectType()
export class AttendanceSummaryResponse {
  @Field()
  totalDays: number;

  @Field()
  presentDays: number;

  @Field()
  absentDays: number;

  @Field()
  suspendedDays: number;

  @Field()
  lateDays: number;

  @Field()
  percentage: number;

  @Field(() => [AttendanceRecordSummary])
  records: AttendanceRecordSummary[];
}
