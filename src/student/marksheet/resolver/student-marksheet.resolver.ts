import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { StudentMarksheetService } from '../services/student-marksheet.service';
import { GetStudentMarksFilterDto, StudentMarkDetail, StudentRanking, StudentReportCard, SubjectPerformance } from '../dtos/get-student-marks.dto';
import { MembershipRole } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { Roles } from 'src/iam/decorators/roles.decorator';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';

@Resolver()
export class StudentMarksheetResolver {
  constructor(private readonly studentMarksheetService: StudentMarksheetService) {}

  @Query(() => [StudentMarkDetail], {
    description: 'Get all marks for a student with optional filters',
  })
  @Roles(MembershipRole.STUDENT, MembershipRole.PARENT, MembershipRole.TEACHER, MembershipRole.SCHOOL_ADMIN)
  async studentMarks(
    @Args('studentId') studentId: string,
    @Args('filter', { type: () => GetStudentMarksFilterDto, nullable: true })
    filter: GetStudentMarksFilterDto,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<StudentMarkDetail[]> {
    return this.studentMarksheetService.getStudentMarks(
      studentId,
      filter || {},
      currentUser,
    );
  }

  @Query(() => StudentReportCard, {
    description: 'Get comprehensive report card for a student',
  })
  @Roles(MembershipRole.STUDENT, MembershipRole.PARENT, MembershipRole.TEACHER, MembershipRole.SCHOOL_ADMIN)
  async studentReportCard(
    @Args('studentId') studentId: string,
    @Args('academicYear') academicYear: string,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<StudentReportCard> {
    return this.studentMarksheetService.getStudentReportCard(
      studentId,
      academicYear,
      currentUser,
    );
  }

  @Query(() => SubjectPerformance, {
    description: 'Get detailed performance for a specific subject',
  })
  @Roles(MembershipRole.STUDENT, MembershipRole.PARENT, MembershipRole.TEACHER, MembershipRole.SCHOOL_ADMIN)
  async studentSubjectPerformance(
    @Args('studentId') studentId: string,
    @Args('subjectId') subjectId: string,
    @Args('academicYear') academicYear: string,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<SubjectPerformance> {
    return this.studentMarksheetService.getSubjectPerformance(
      studentId,
      subjectId,
      academicYear,
      currentUser,
    );
  }

  @Query(() => StudentRanking, {
    description: 'Get student ranking within their grade level',
  })
  @Roles(MembershipRole.STUDENT, MembershipRole.PARENT, MembershipRole.TEACHER, MembershipRole.SCHOOL_ADMIN)
  async studentRanking(
    @Args('studentId') studentId: string,
    @Args('academicYear') academicYear: string,
    @Args('term') term: number,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<StudentRanking> {
    return this.studentMarksheetService.getStudentRanking(
      studentId,
      academicYear,
      term,
      currentUser,
    );
  }
}