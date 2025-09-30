import { Field, Float, GraphQLISODateTime, ID, Int, ObjectType } from "@nestjs/graphql";
import { Student } from "src/admin/student/entities/student.entity";

@ObjectType({ description: 'Individual ledger entry' })
export class LedgerEntry {
  @Field(() => GraphQLISODateTime)
  date: Date;

  @Field()
  description: string;

  @Field()
  reference: string;

  @Field(() => Float)
  debit: number;

  @Field(() => Float)
  credit: number;

  @Field(() => Float)
  balance: number;

  @Field({ nullable: true })
  invoiceNumber?: string;

  @Field({ nullable: true })
  receiptNumber?: string;
}

@ObjectType({ description: 'Ledger summary' })
export class LedgerSummary {
  @Field(() => Float)
  totalInvoiced: number;

  @Field(() => Float)
  totalPaid: number;

  @Field(() => Float)
  totalBalance: number;

  @Field(() => Int)
  invoiceCount: number;

  @Field(() => Int)
  paymentCount: number;

  @Field(() => GraphQLISODateTime, { nullable: true })
  lastPaymentDate?: Date;

  @Field(() => Float)
  averagePaymentAmount: number;
}

@ObjectType({ description: 'Complete student ledger' })
export class StudentLedger {
  @Field(() => ID)
  studentId: string;

  @Field(() => Student)
  student: Student;

  @Field(() => [LedgerEntry])
  entries: LedgerEntry[];

  @Field(() => LedgerSummary)
  summary: LedgerSummary;

  @Field(() => GraphQLISODateTime)
  generatedAt: Date;

  @Field({ nullable: true })
  dateRangeStart?: Date;

  @Field({ nullable: true })
  dateRangeEnd?: Date;
}
