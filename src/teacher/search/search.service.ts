import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SearchProvider } from './providers/search.provider';
import {
  SearchStudentInput,
  FilterInput,
  SearchStudentResult,
  SearchTeacherResult,
  CombinedSearchResult,
  FilteredResult,
} from './dto/search.dto';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';

@Injectable()
export class SearchService {
  constructor(private readonly searchProvider: SearchProvider) {}

  private getTenantId(user: ActiveUserData): string {
      if (!user.tenantId) {
        throw new UnauthorizedException('Tenant ID is missing from the active user');
      }
      return user.tenantId;
    }

  async searchStudentByName(
    input: SearchStudentInput,
    currentUser: ActiveUserData,
  ): Promise<SearchStudentResult> {
    const tenantId = this.getTenantId(currentUser);
    const students = await this.searchProvider.searchStudentByName(
      input.name,
      tenantId,
    );

    return {
      students,
      count: students.length,
    };
  }

  async searchTeacherByName(
    input: SearchStudentInput,
    currentUser: ActiveUserData,
  ): Promise<SearchTeacherResult> {
    const teachers = await this.searchProvider.searchTeacherByName(
      input.name,
      this.getTenantId(currentUser),
    );

    return {
      teachers,
      count: teachers.length,
    };
  }

  async getStudentsByTenant(currentUser: ActiveUserData): Promise<SearchStudentResult> {
    const tenantId = this.getTenantId(currentUser);
    console.log('kjf....................................')
    const students = await this.searchProvider.getStudentsByTenant(tenantId);

    return {
      students,
      count: students.length,
    };
  }

  async getTeachersByTenant(currentUser: ActiveUserData): Promise<SearchTeacherResult> {
    const tenantId = this.getTenantId(currentUser);
    const teachers = await this.searchProvider.getTeachersByTenant(tenantId);

    return {
      teachers,
      count: teachers.length,
    };
  }

  async getBothStudentsAndTeachersByTenant(
    currentUser: ActiveUserData,
  ): Promise<CombinedSearchResult> {
    const tenantId = this.getTenantId(currentUser);
    const { students, teachers } =
      await this.searchProvider.getBothStudentsAndTeachersByTenant(tenantId);

    return {
      students,
      teachers,
      totalCount: students.length + teachers.length,
    };
  }



  async filterByGradeLevelAndSubjects(
    input: FilterInput,
    currentUser: ActiveUserData,
  ): Promise<FilteredResult> {
    const tenantId = this.getTenantId(currentUser);
    const { students, teachers } =
      await this.searchProvider.filterByGradeLevelAndSubjects(
        tenantId,
        input.tenantGradeLevelIds,
        input.tenantSubjectIds,
        input.streamIds,
      );

    return {
      students: students.length > 0 ? students : undefined,
      teachers: teachers.length > 0 ? teachers : undefined,
      totalCount: students.length + teachers.length,
    };
  }

  async getTenantStatistics(currentUser: ActiveUserData): Promise<{
    studentCount: number;
    teacherCount: number;
    streamCount: number;
    totalCount: number;
  }> {
    const tenantId = this.getTenantId(currentUser);
    const [studentCount, teacherCount, streamCount] = await Promise.all([
      this.searchProvider.countStudentsByTenant(tenantId),
      this.searchProvider.countTeachersByTenant(tenantId),
      this.searchProvider.countStreamsByTenant(tenantId),
    ]);

    return {
      studentCount,
      teacherCount,
      streamCount,
      totalCount: studentCount + teacherCount,
    };
  }

  async getStreamsByTenant(currentUser: ActiveUserData) {
    const tenantId = this.getTenantId(currentUser);
    return this.searchProvider.getStreamsByTenant(tenantId);
  }
}
