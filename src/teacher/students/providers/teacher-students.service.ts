import { Injectable } from '@nestjs/common';
import { TeacherStudentsProvider } from '../providers/teacher-students.provider';
import { Student } from 'src/admin/student/entities/student.entity';
import { TeacherStudentDto, TeacherStudentGradeDto } from 'src/teacher/dtos/teacher-student.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeacherStudentResponse } from 'src/teacher/dtos/Teacher-student-response.dto';

@Injectable()
export class TeacherStudentsService {
  constructor(
    private readonly teacherStudentsProvider: TeacherStudentsProvider,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  // async getStudentsByTenant(tenantId: string): Promise<Student[]> {
  //   return await this.teacherStudentsProvider.findStudentsByTenant(tenantId);
  // }

  async getStudentsByTenant(tenantId: string): Promise<TeacherStudentResponse[]> {
    const students = await this.teacherStudentsProvider.findStudentsByTenant(tenantId);
  
    return students.map((student) => ({
      id: student.id,
      admission_number: student.admission_number,
      phone: student.phone,
      gender: student.gender,
      feesOwed: student.feesOwed,
      totalFeesPaid: student.totalFeesPaid,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
      
      grade: student.grade && student.grade.gradeLevel
        ? ({
            id: student.grade.id,
            name: student.grade.gradeLevel.name,
            code: student.grade.gradeLevel.code,
          } as TeacherStudentGradeDto)
        : null,
      stream: student.stream
        ? {
            id: student.stream.id,
            name: student.stream.name,
          }
        : null,
      grade_level_id: student.grade?.id || null,
      streamId: student.stream?.id || null,

      user: student.user && student.user.name ? ({
        id: student.user.id,
        name: student.user.name,
        email: student.user.email,
      }) : null,
    })) as TeacherStudentResponse[];
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

  // async getStudentsByGradeLevel(
  //   gradeLevelId: string,
  //   tenantId: string,
  // ): Promise<Student[]> {
  //   return await this.teacherStudentsProvider.findStudentsByGradeLevel(
  //     gradeLevelId,
  //     tenantId,
  //   );
  // }

  async getStudentsByStream(
    streamId: string,
    tenantId: string,
  ): Promise<Student[]> {
    return await this.teacherStudentsProvider.findStudentsByStream(
      streamId,
      tenantId,
    );
  }


  async getStudentsByGradeLevel(
    gradeLevelId: string,
    tenantId: string,
  ): Promise<Student[]> {
    return await this.studentRepository.find({
      where: {
        tenant_id: tenantId,
        grade: { id: gradeLevelId },
      },
      relations: ['user', 'grade']
    });
  }
}
