import { Injectable } from '@nestjs/common';
import { TeacherStudentsProvider } from '../providers/teacher-students.provider';
import { Student } from 'src/admin/student/entities/student.entity';

@Injectable()
export class TeacherStudentsService {
  constructor(
    private readonly teacherStudentsProvider: TeacherStudentsProvider,
  ) {}

  async getStudentsByTenant(tenantId: string): Promise<Student[]> {
    return await this.teacherStudentsProvider.findStudentsByTenant(tenantId);
  }

  async getStudentById(
    studentId: string,
    tenantId: string,
  ): Promise<Student | null> {
    return await this.teacherStudentsProvider.findStudentById(
      studentId,
      tenantId,
    );
  }

  async getStudentsByGradeLevel(
    gradeLevelId: string,
    tenantId: string,
  ): Promise<Student[]> {
    return await this.teacherStudentsProvider.findStudentsByGradeLevel(
      gradeLevelId,
      tenantId,
    );
  }

  async getStudentsByStream(
    streamId: string,
    tenantId: string,
  ): Promise<Student[]> {
    return await this.teacherStudentsProvider.findStudentsByStream(
      streamId,
      tenantId,
    );
  }
}
