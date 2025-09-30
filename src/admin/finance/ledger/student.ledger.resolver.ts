import { Args, ID, Mutation, Query, Resolver } from "@nestjs/graphql";
import { Logger } from "@nestjs/common";
import { LedgerEntry, LedgerSummary, StudentLedger } from "./ledger.input.dto";
import { LedgerService } from "./ledger.service";
import { DateRangeInput } from "../payment/dtos/create-payment.input";
import { ActiveUserData } from "src/admin/auth/interface/active-user.interface";
import { ActiveUser } from "src/admin/auth/decorator/active-user.decorator";

@Resolver(() => StudentLedger)
export class LedgerResolver {
  private readonly logger = new Logger(LedgerResolver.name);

  constructor(private readonly ledgerService: LedgerService) {}

  @Query(() => StudentLedger, {
    description: 'Get complete ledger for a student'
  })
  async studentLedger(
    @Args('studentId', { type: () => ID }) studentId: string,
    @Args('dateRange', { type: () => DateRangeInput, nullable: true }) dateRange: DateRangeInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<StudentLedger> {
    this.logger.log(`Fetching ledger for student ${studentId}`);
    return await this.ledgerService.getStudentLedger(studentId, dateRange, user);
  }

  @Query(() => [LedgerEntry], {
    description: 'Get ledger entries for a student'
  })
  async ledgerEntries(
    @Args('studentId', { type: () => ID }) studentId: string,
    @Args('dateRange', { type: () => DateRangeInput, nullable: true }) dateRange: DateRangeInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<LedgerEntry[]> {
    this.logger.log(`Fetching ledger entries for student ${studentId}`);
    return await this.ledgerService.getLedgerEntries(studentId, dateRange, user);
  }

  @Query(() => LedgerSummary, {
    description: 'Get ledger summary for a student'
  })
  async ledgerSummary(
    @Args('studentId', { type: () => ID }) studentId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<LedgerSummary> {
    this.logger.log(`Fetching ledger summary for student ${studentId}`);
    return await this.ledgerService.getLedgerSummary(studentId, user);
  }

  @Query(() => [StudentLedger], {
    description: 'Get ledgers for multiple students by grade level'
  })
  async ledgersByGradeLevel(
    @Args('gradeLevelId', { type: () => ID }) gradeLevelId: string,
    @Args('dateRange', { type: () => DateRangeInput, nullable: true }) dateRange: DateRangeInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<StudentLedger[]> {
    this.logger.log(`Fetching ledgers for grade level ${gradeLevelId}`);
    return await this.ledgerService.getLedgersByGradeLevel(gradeLevelId, dateRange, user);
  }

  @Mutation(() => String, {
    description: 'Generate ledger report PDF'
  })
  async generateLedgerPDF(
    @Args('studentId', { type: () => ID }) studentId: string,
    @Args('dateRange', { type: () => DateRangeInput, nullable: true }) dateRange: DateRangeInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<string> {
    this.logger.log(`Generating ledger PDF for student ${studentId}`);
    return await this.ledgerService.generateLedgerPDF(studentId, dateRange, user);
  }
}
