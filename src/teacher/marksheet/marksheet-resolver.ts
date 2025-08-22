import { Resolver } from "@nestjs/graphql";
import { MarksheetService } from "./providers/marksheet-service";
import { Query } from "@nestjs/common";

@Resolver()
export class MarksheetResolver {
  constructor(private marksheetService: MarksheetService) {}

  @Query(() => MarksheetResponse)
  async getMarksheet(
    @Args('tenantGradeLevelId') tenantGradeLevelId: string,
    @Args('tenantSubjectId') tenantSubjectId: string,
    @Args('term') term: number,
  ): Promise<MarksheetData> {
    return this.marksheetService.getMarksheet(
      tenantGradeLevelId,
      tenantSubjectId,
      term,
    );
  }

  @Query(() => StudentReportResponse)
  async getStudentReport(
    @Args('studentId') studentId: string,
    @Args('tenantGradeLevelId') tenantGradeLevelId: string,
    @Args('tenantSubjectId') tenantSubjectId: string,
    @Args('term') term: number,
  ) {
    return this.marksheetService.getStudentReport(
      studentId,
      tenantGradeLevelId,
      tenantSubjectId,
      term,
    );
  }

  @Mutation(() => Mark)
  async createMark(@Args('input') input: CreateMarkInput): Promise<Mark> {
    return this.marksheetService.createMark(input);
  }

  @Mutation(() => Mark)
  async updateMark(@Args('input') input: UpdateMarkInput): Promise<Mark> {
    return this.marksheetService.updateMark(input);
  }

  @Mutation(() => Boolean)
  async deleteMark(@Args('id') id: string): Promise<boolean> {
    return this.marksheetService.deleteMark(id);
  }

  @Mutation(() => [Mark])
  async createMultipleMarks(
    @Args({ name: 'inputs', type: () => [CreateMarkInput] })
    inputs: CreateMarkInput[],
  ): Promise<Mark[]> {
    const results = await Promise.allSettled(
      inputs.map((input) => this.marksheetService.createMark(input)),
    );

    const successful = results
      .filter((result) => result.status === 'fulfilled')
      .map((result) => (result as PromiseFulfilledResult<Mark>).value);

    const failed = results
      .filter((result) => result.status === 'rejected')
      .map((result) => (result as PromiseRejectedResult).reason);

    if (failed.length > 0) {
      console.warn('Some marks failed to create:', failed);
    }

    return successful;
  }
}
