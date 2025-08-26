import { Args, Context, Query, Resolver, Mutation, Int } from "@nestjs/graphql";
import { MarkService } from "./providers/marksheet-service";
import { AssessmentMark } from "./entities/assessment_marks-entity";
import { ActiveUserData } from "src/admin/auth/interface/active-user.interface";
import { ActiveUser } from "src/admin/auth/decorator/active-user.decorator";
import { EnterStudentMarksInput, MarksStatsDto } from "./dtos/enter-mark.input";
import { TermAssessmentWithStudentsDto } from "./dtos/term-assessment-with-students.dto";
import { Roles } from "src/iam/decorators/roles.decorator";
import { MembershipRole } from "src/admin/user-tenant-membership/entities/user-tenant-membership.entity";

@Resolver()
@Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.TEACHER)
export class MarkResolver {
  constructor(private markService: MarkService) {}

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

  @Query(() => TermAssessmentWithStudentsDto)
  async termAssessmentsWithStudents(
    @Args('term', { type: () => Int }) term: number,
    @Args('gradeLevelId') gradeLevelId: string,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.markService.getTermAssessmentsWithStudents(
      term,
      gradeLevelId,
      user.tenantId,
    );
  }

  @Mutation(() => [AssessmentMark])
  async updateStudentMarks(
    @Args('inputs', { type: () => [EnterStudentMarksInput] })
    inputs: EnterStudentMarksInput[],
    @ActiveUser() user: ActiveUserData,
  ) {
    const all: AssessmentMark[] = [];
    for (const input of inputs) {
      all.push(...(await this.markService.updateStudentMarks(input, user)));
    }
    return all;
  }

  @Query(() => MarksStatsDto)
  async marksStats(
    @Args('term', { type: () => Int }) term: number,
    @Args('gradeLevelId') gradeLevelId: string,
    @Args('subjectId') subjectId: string,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.markService.marksStats(
      term,
      gradeLevelId,
      subjectId,
      user.tenantId,
    );
  }
}
