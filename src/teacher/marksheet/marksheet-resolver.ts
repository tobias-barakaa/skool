import { Args, Context, Query, Resolver, Mutation } from "@nestjs/graphql";
import { MarkService } from "./providers/marksheet-service";
import {  MarksheetResponse } from "./dtos/mark-input";
import { AssessmentMark } from "./entities/assessment_marks-entity";
import { ActiveUserData } from "src/admin/auth/interface/active-user.interface";
import { ActiveUser } from "src/admin/auth/decorator/active-user.decorator";
import { EnterStudentMarksInput } from "./dtos/enter-mark.input";

@Resolver()
export class MarkResolver {
  constructor(private markService: MarkService) {}

  @Query(() => MarksheetResponse)
  async marksheet(
    @Context('tenantId') tenantId: string,
    @Args('gradeId') gradeId: string,
    @Args('subjectId') subjectId: string,
    @Args('term') term: number,
  ) {
    return this.markService.getMarksheet(tenantId, gradeId, subjectId, term);
  }

  // @Mutation(() => [AssessmentMark])
  // async enterStudentMarks(
  //   @Args('input') input: EnterStudentMarksInput,
  //   @ActiveUser() user: ActiveUserData,
  // ): Promise<AssessmentMark[]> {
  //   return this.markService.enterStudentMarks(input, user);
  // }

  // GraphQL Resolver
  @Mutation(() => [AssessmentMark])
  async enterStudentMarks(
    @Args('inputs', { type: () => [EnterStudentMarksInput] })
    inputs: EnterStudentMarksInput[],
    @ActiveUser() user: ActiveUserData,
  ): Promise<AssessmentMark[]> {
    const all: AssessmentMark[] = [];
    for (const input of inputs) {
      const marks = await this.markService.enterStudentMarks(input, user);
      all.push(...marks);
    }
    return all;
  }
}
