import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from 'src/admin/student/entities/student.entity';
import { Teacher } from 'src/admin/teacher/entities/teacher.entity';
import { Stream } from 'src/admin/streams/entities/streams.entity';

@Injectable()
export class SearchProvider {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    @InjectRepository(Stream)
    private readonly streamRepository: Repository<Stream>,
  ) {}

  async searchStudentByName(name: string, tenantId: string): Promise<Student[]> {
    return this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('student.grade', 'grade')
      .leftJoinAndSelect('grade.gradeLevel', 'gradeLevel')
      .leftJoinAndSelect('student.stream', 'stream')
      .leftJoinAndSelect('student.tenant', 'tenant')
      .where('student.tenant_id = :tenantId', { tenantId })
      .andWhere('user.name ILIKE :name', { name: `%${name}%` })
      .andWhere('student.isActive = :isActive', { isActive: true })
      .orderBy('user.name', 'ASC')
      .getMany();
  }

  async searchTeacherByName(name: string, tenantId: string): Promise<Teacher[]> {
    return this.teacherRepository
      .createQueryBuilder('teacher')
      .leftJoinAndSelect('teacher.user', 'user')
      .leftJoinAndSelect('teacher.tenantSubjects', 'tenantSubjects')
      .leftJoinAndSelect('tenantSubjects.subject', 'subject')
      .leftJoinAndSelect('tenantSubjects.customSubject', 'customSubject')
      .leftJoinAndSelect('teacher.tenantGradeLevels', 'tenantGradeLevels')
      .leftJoinAndSelect('tenantGradeLevels.gradeLevel', 'gradeLevel')
      .leftJoinAndSelect('teacher.tenantStreams', 'tenantStreams')
      .leftJoinAndSelect('teacher.classTeacherOf', 'classTeacherOf')
      .leftJoinAndSelect('teacher.tenant', 'tenant')
      .where('teacher.tenantId = :tenantId', { tenantId })
      .andWhere(
        '(teacher.fullName ILIKE :name OR teacher.firstName ILIKE :name OR teacher.lastName ILIKE :name)',
        { name: `%${name}%` }
      )
      .andWhere('teacher.isActive = :isActive', { isActive: true })
      .orderBy('teacher.fullName', 'ASC')
      .getMany();
  }

  async getStudentsByTenant(tenantId: string): Promise<Student[]> {
    console.log('dkjfkdjfkdjfk.................................')
    const students = await this.studentRepository
      .createQueryBuilder('student')
      .innerJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('student.grade', 'grade')
      .leftJoinAndSelect('grade.gradeLevel', 'gradeLevel')
      .leftJoinAndSelect('student.stream', 'stream')
      .leftJoinAndSelect('student.tenant', 'tenant')
      .where('student.tenant_id = :tenantId', { tenantId })
      .andWhere('student.isActive = :isActive', { isActive: true })
      .orderBy('user.name', 'ASC')
      .getMany();
  
    // Safe transformation - handle nullable relations
    return students.map(student => ({
      ...student,
      // Ensure nested objects exist before accessing properties
      user: student.user || null,
      grade: student.grade || null,
      stream: student.stream || null,
      // Add any other transformations here
    })) as Student[];
  }

  async getTeachersByTenant(tenantId: string): Promise<Teacher[]> {
    return this.teacherRepository
      .createQueryBuilder('teacher')
      .leftJoinAndSelect('teacher.user', 'user')
      .leftJoinAndSelect('teacher.tenantSubjects', 'tenantSubjects')
      .leftJoinAndSelect('tenantSubjects.subject', 'subject')
      .leftJoinAndSelect('tenantSubjects.customSubject', 'customSubject')
      .leftJoinAndSelect('teacher.tenantGradeLevels', 'tenantGradeLevels')
      .leftJoinAndSelect('tenantGradeLevels.gradeLevel', 'gradeLevel')
      .leftJoinAndSelect('teacher.tenantStreams', 'tenantStreams')
      .leftJoinAndSelect('teacher.classTeacherOf', 'classTeacherOf')
      .leftJoinAndSelect('teacher.tenant', 'tenant')
      .where('teacher.tenantId = :tenantId', { tenantId })
      .andWhere('teacher.isActive = :isActive', { isActive: true })
      .orderBy('teacher.fullName', 'ASC')
      .getMany();
  }

  async getBothStudentsAndTeachersByTenant(tenantId: string): Promise<{
    students: Student[];
    teachers: Teacher[];
  }> {
    const [students, teachers] = await Promise.all([
      this.getStudentsByTenant(tenantId),
      this.getTeachersByTenant(tenantId),
    ]);

    return { students, teachers };
  }

  async filterByGradeLevelAndSubjects(
    tenantId: string,
    tenantGradeLevelIds?: string[],
    tenantSubjectIds?: string[],
    streamIds?: string[]
  ): Promise<{ students: Student[]; teachers: Teacher[] }> {
    let students: Student[] = [];
    let teachers: Teacher[] = [];

    const studentQuery = this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('student.grade', 'grade')
      .leftJoinAndSelect('grade.gradeLevel', 'gradeLevel')
      .leftJoinAndSelect('student.stream', 'stream')
      .leftJoinAndSelect('student.tenant', 'tenant')
      .where('student.tenant_id = :tenantId', { tenantId })
      .andWhere('student.isActive = :isActive', { isActive: true });

    if (tenantGradeLevelIds && tenantGradeLevelIds.length > 0) {
      studentQuery.andWhere('grade.id IN (:...tenantGradeLevelIds)', { tenantGradeLevelIds });
    }

    if (streamIds && streamIds.length > 0) {
      studentQuery.andWhere('stream.id IN (:...streamIds)', { streamIds });
    }

    students = await studentQuery.orderBy('user.name', 'ASC').getMany();

    const teacherQuery = this.teacherRepository
      .createQueryBuilder('teacher')
      .leftJoinAndSelect('teacher.user', 'user')
      .leftJoinAndSelect('teacher.tenantSubjects', 'tenantSubjects')
      .leftJoinAndSelect('tenantSubjects.subject', 'subject')
      .leftJoinAndSelect('tenantSubjects.customSubject', 'customSubject')
      .leftJoinAndSelect('teacher.tenantGradeLevels', 'tenantGradeLevels')
      .leftJoinAndSelect('tenantGradeLevels.gradeLevel', 'gradeLevel')
      .leftJoinAndSelect('teacher.tenantStreams', 'tenantStreams')
      .leftJoinAndSelect('teacher.classTeacherOf', 'classTeacherOf')
      .leftJoinAndSelect('teacher.tenant', 'tenant')
      .where('teacher.tenantId = :tenantId', { tenantId })
      .andWhere('teacher.isActive = :isActive', { isActive: true });

    if (tenantSubjectIds && tenantSubjectIds.length > 0) {
      teacherQuery.andWhere('tenantSubjects.id IN (:...tenantSubjectIds)', {
        tenantSubjectIds,
      });
    }

    if (tenantGradeLevelIds && tenantGradeLevelIds.length > 0) {
      teacherQuery.andWhere('tenantGradeLevels.id IN (:...tenantGradeLevelIds)', {
        tenantGradeLevelIds,
      });
    }

    teachers = await teacherQuery.orderBy('teacher.fullName', 'ASC').getMany();

    return { students, teachers };
  }

  async getStreamsByTenant(tenantId: string): Promise<Stream[]> {
    return this.streamRepository
      .createQueryBuilder('stream')
      .leftJoinAndSelect('stream.gradeLevel', 'gradeLevel')
      .leftJoinAndSelect('stream.tenant', 'tenant')
      .leftJoinAndSelect('stream.students', 'students')
      .where('stream.tenantId = :tenantId', { tenantId })
      .andWhere('stream.isActive = :isActive', { isActive: true })
      .orderBy('gradeLevel.name', 'ASC')
      .addOrderBy('stream.name', 'ASC')
      .getMany();
  }

  async countStudentsByTenant(tenantId: string): Promise<number> {
    return this.studentRepository.count({
      where: { tenant_id: tenantId, isActive: true },
    });
  }

  async countTeachersByTenant(tenantId: string): Promise<number> {
    return this.teacherRepository.count({
      where: { tenantId, isActive: true },
    });
  }

  async countStreamsByTenant(tenantId: string): Promise<number> {
    return this.streamRepository.count({
      where: { tenantId, isActive: true },
    });
  }
}



