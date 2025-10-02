import { Resolver, Query, Args, ID } from '@nestjs/graphql';
import { Logger } from '@nestjs/common';
import { GradeLevelStudentsSummary, StudentSummary } from './dtos/student-summary.dto';
import { StudentSummaryService } from './providers/student-summary.service';
import { Roles } from 'src/iam/decorators/roles.decorator';
import { MembershipRole } from '../user-tenant-membership/entities/user-tenant-membership.entity';
import { ActiveUserData } from '../auth/interface/active-user.interface';
import { ActiveUser } from '../auth/decorator/active-user.decorator';

@Resolver()
export class StudentSummaryResolver {
  private readonly logger = new Logger(StudentSummaryResolver.name);

  constructor(private readonly summaryService: StudentSummaryService) {}

  @Query(() => StudentSummary, {
    name: 'studentSummary',
    description: 'Get comprehensive summary for a single student including all fee details',
  })
  @Roles(MembershipRole.SCHOOL_ADMIN)
  async studentSummary(
    @Args('studentId', { type: () => ID }) studentId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<StudentSummary> {
    this.logger.log(
      `Fetching summary for student ${studentId} by user ${user.sub}`,
    );
    return this.summaryService.getStudentSummary(studentId, user);
  }

  @Query(() => [StudentSummary], {
    name: 'allStudentsSummary',
    description: 'Get comprehensive summaries for all students in the tenant',
  })
  @Roles(MembershipRole.SCHOOL_ADMIN)
  async allStudentsSummary(
    @ActiveUser() user: ActiveUserData,
  ): Promise<StudentSummary[]> {
    this.logger.log(`Fetching all students summary for tenant ${user.tenantId}`);
    return this.summaryService.getAllStudentsSummary(user);
  }

  @Query(() => [GradeLevelStudentsSummary], {
    name: 'studentsSummaryByGradeLevel',
    description: 'Get students summary grouped by grade level with aggregated statistics',
  })
  @Roles(MembershipRole.SCHOOL_ADMIN)
  async studentsSummaryByGradeLevel(
    @ActiveUser() user: ActiveUserData,
  ): Promise<GradeLevelStudentsSummary[]> {
    this.logger.log(
      `Fetching students summary by grade level for tenant ${user.tenantId}`,
    );
    return this.summaryService.getStudentsSummaryByGradeLevel(user);
  }

  @Query(() => GradeLevelStudentsSummary, {
    name: 'studentsSummaryForGradeLevel',
    description: 'Get students summary for a specific grade level',
  })
  @Roles(MembershipRole.SCHOOL_ADMIN)
  async studentsSummaryForGradeLevel(
    @Args('gradeLevelId', { type: () => ID }) gradeLevelId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<GradeLevelStudentsSummary> {
    this.logger.log(
      `Fetching students summary for grade level ${gradeLevelId}`,
    );
    return this.summaryService.getStudentsSummaryBySpecificGradeLevel(
      gradeLevelId,
      user,
    );
  }
}