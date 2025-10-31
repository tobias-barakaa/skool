// parent-portal.resolver.ts
import { Resolver, Query, Args, ID } from '@nestjs/graphql';
import { ParentPortalService } from '../services/parent-portal.service';
import { Parent } from 'src/admin/parent/entities/parent.entity';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { AttendanceSummaryDto, ChildProfileDto, FeeBalanceDto, MyChildDto, ReportCardDto, SubjectPerformanceDto } from '../dtos/parent-portal.dto';
import { Attendance } from 'src/teacher/attendance/entities/attendance.entity';

@Resolver()
export class ParentPortalResolver {
  constructor(private readonly parentPortalService: ParentPortalService) {}

  // Get parent profile
  @Query(() => Parent, { description: 'Get the logged-in parent profile' })
  async myParentProfile(@ActiveUser() user: ActiveUserData): Promise<Parent> {
    console.log('Fetching parent profile for user:::::::::::::::::::', user); 
    return this.parentPortalService.getParentByUserId(user.sub, user.tenantId);
  }

  // Get all children
  @Query(() => [MyChildDto], { description: 'Get all children for the logged-in parent' })
  async myChildren(@ActiveUser() user: ActiveUserData): Promise<MyChildDto[]> {
    return this.parentPortalService.getMyChildren(user);
  }

  // Get child profile
  @Query(() => ChildProfileDto, { description: 'Get detailed profile of a specific child' })
  async childProfile(
    @Args('studentId', { type: () => ID }) studentId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<ChildProfileDto> {
    const profile = await this.parentPortalService.getChildProfile(studentId, user);

    const normalizedStream = profile.stream
      ? {
          // tenantGradeLevel is required on TenantStream; prefer explicit fields if present, otherwise fall back to profile.grade
          tenantGradeLevel: (profile.stream as any).tenantGradeLevel ?? (profile.grade as any) ?? undefined,
          // stream (the stream name/identifier) prefer explicit fields commonly present on Stream entities
          stream: (profile.stream as any).stream ?? (profile.stream as any).name ?? (profile.stream as any).id ?? undefined,
        }
      : undefined;

    const result: ChildProfileDto = {
      ...profile,
      stream: normalizedStream as any,
    };

    return result;
  }

  
  // Get attendance summary
  @Query(() => AttendanceSummaryDto, { description: 'Get attendance summary for a child' })
  async childAttendanceSummary(
    @Args('studentId', { type: () => ID }) studentId: string,
    @Args('startDate') startDate: string,
    @Args('endDate') endDate: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<AttendanceSummaryDto> {
    return this.parentPortalService.getChildAttendanceSummary(
      studentId,
      startDate,
      endDate,
      user,
    );
  }



  // Get attendance details
  @Query(() => [Attendance], { description: 'Get detailed attendance records for a child' })
  async childAttendanceDetails(
    @Args('studentId', { type: () => ID }) studentId: string,
    @Args('startDate') startDate: string,
    @Args('endDate') endDate: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<Attendance[]> {
    return this.parentPortalService.getChildAttendanceDetails(
      studentId,
      startDate,
      endDate,
      user,
    );
  }


  
  

  // Get fee balance
  @Query(() => FeeBalanceDto, { description: 'Get fee balance and breakdown for a child' })
  async childFeeBalance(
    @Args('studentId', { type: () => ID }) studentId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<FeeBalanceDto> {
    return this.parentPortalService.getChildFeeBalance(studentId, user);
  }

//   // Get payment history
//   @Query(() => [Payment], { description: 'Get payment history for a child' })
//   async childPaymentHistory(
//     @Args('studentId', { type: () => ID }) studentId: string,
//     @ActiveUser() user: ActiveUserData,
//   ): Promise<Payment[]> {
//     return this.parentPortalService.getChildPaymentHistory(studentId, user);
//   }

//   // Get academic performance
//   @Query(() => [SubjectPerformanceDto], { description: 'Get academic performance for a child' })
//   async childPerformance(
//     @Args('studentId', { type: () => ID }) studentId: string,
//     @Args('term', { type: () => Number, nullable: true }) term?: number,
//     @Args('academicYear', { nullable: true }) academicYear?: string,
//     @ActiveUser() user?: ActiveUserData,
//   ): Promise<SubjectPerformanceDto[]> {
//     return this.parentPortalService.getChildPerformance(
//       studentId,
//       term,
//       academicYear,
//       user,
//     );
//   }

//   // Get report card
//   @Query(() => ReportCardDto, { description: 'Get report card for a child for a specific term' })
//   async childReportCard(
//     @Args('studentId', { type: () => ID }) studentId: string,
//     @Args('term', { type: () => Number }) term: number,
//     @Args('academicYear') academicYear: string,
//     @ActiveUser() user: ActiveUserData,
//   ): Promise<ReportCardDto> {
//     return this.parentPortalService.getChildReportCard(
//       studentId,
//       term,
//       academicYear,
//       user,
//     );
//   }
}