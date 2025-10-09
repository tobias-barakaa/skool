import { Injectable } from '@nestjs/common';
import { SearchProvider } from './providers/search.provider';
import {
  SearchStudentInput,
  FilterInput,
  SearchStudentResult,
  SearchTeacherResult,
  CombinedSearchResult,
  FilteredResult,
} from './dto/search.dto';

@Injectable()
export class SearchService {
  constructor(private readonly searchProvider: SearchProvider) {}

  async searchStudentByName(
    input: SearchStudentInput,
    tenantId: string,
  ): Promise<SearchStudentResult> {
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
    tenantId: string,
  ): Promise<SearchTeacherResult> {
    const teachers = await this.searchProvider.searchTeacherByName(
      input.name,
      tenantId,
    );

    return {
      teachers,
      count: teachers.length,
    };
  }

  async getStudentsByTenant(tenantId: string): Promise<SearchStudentResult> {
    console.log('kjf....................................')
    const students = await this.searchProvider.getStudentsByTenant(tenantId);

    return {
      students,
      count: students.length,
    };
  }

  async getTeachersByTenant(tenantId: string): Promise<SearchTeacherResult> {
    const teachers = await this.searchProvider.getTeachersByTenant(tenantId);

    return {
      teachers,
      count: teachers.length,
    };
  }

  async getBothStudentsAndTeachersByTenant(
    tenantId: string,
  ): Promise<CombinedSearchResult> {
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
    tenantId: string,
  ): Promise<FilteredResult> {
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

  async getTenantStatistics(tenantId: string): Promise<{
    studentCount: number;
    teacherCount: number;
    streamCount: number;
    totalCount: number;
  }> {
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

  async getStreamsByTenant(tenantId: string) {
    return this.searchProvider.getStreamsByTenant(tenantId);
  }
}
