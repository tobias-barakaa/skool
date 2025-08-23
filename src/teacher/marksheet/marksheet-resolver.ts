import { Args, Context, Query, Resolver, Mutation } from "@nestjs/graphql";
import { MarkService } from "./providers/marksheet-service";
import { Mark } from "./entities/marksheet-entity";
import { MarkInput, MarksheetResponse } from "./dtos/mark-input";

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

  @Mutation(() => [Mark])
  async addMarks(
    @Context('tenantId') tenantId: string,
    @Args('marks', { type: () => [MarkInput] }) marks: MarkInput[],
  ) {
    return this.markService.addMarks(tenantId, marks);
  }
}
