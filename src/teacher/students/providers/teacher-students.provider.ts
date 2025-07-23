import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Student } from 'src/admin/student/entities/student.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TeacherStudentsProvider {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  async findStudentsByTenant(tenantId: string): Promise<Student[]> {
    return await this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoin('user.memberships', 'membership')
      .leftJoinAndSelect('student.grade', 'grade')
      .leftJoinAndSelect('student.stream', 'stream')
      .where('membership.tenantId = :tenantId', { tenantId })
      .andWhere('student.isActive = :isActive', { isActive: true })
      .getMany();
  }

  // async findStudentsByTenant(tenantId: string): Promise<Student[]> {
  //   return await this.studentRepository
  //     .createQueryBuilder('student')
  //     .innerJoin('student.user', 'user')
  //     .leftJoinAndSelect('student.grade', 'grade')
  //     .leftJoinAndSelect('student.stream', 'stream')
  //     .where('user.tenantId = :tenantId', { tenantId })
  //     .andWhere('student.isActive = :isActive', { isActive: true })
  //     .select([
  //       'student.id',
  //       'student.admission_number',
  //       'student.user_id',
  //       'student.phone',
  //       'student.gender',
  //       'student.feesOwed',
  //       'student.totalFeesPaid',
  //       'student.createdAt',
  //       'student.updatedAt',
  //       'grade.id',
  //       'grade.name',
  //       'grade.code',
  //       'stream.id',
  //       'stream.name',
  //     ])
  //     .getMany();
  // }

  async findStudentById(
    studentId: string,
    tenantId: string,
  ): Promise<Student | null> {
    return await this.studentRepository
      .createQueryBuilder('student')
      .innerJoin('student.user', 'user')
      .where('student.id = :studentId', { studentId })
      .andWhere('user.tenantId = :tenantId', { tenantId })
      .andWhere('student.isActive = :isActive', { isActive: true })
      .getOne();
  }

  async findStudentsByGradeLevel(
    gradeLevelId: string,
    tenantId: string,
  ): Promise<Student[]> {
    return await this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.grade', 'grade')
      .leftJoin('parent', 'parent', 'parent.studentId = student.id') // or use user_roles
      .where('grade.id = :gradeLevelId', { gradeLevelId })
      .andWhere('parent.tenantId = :tenantId', { tenantId }) // adjust for actual table used
      .getMany();
  }

  async findStudentsByStream(
    streamId: string,
    tenantId: string,
  ): Promise<Student[]> {
    return await this.studentRepository
      .createQueryBuilder('student')
      .innerJoin('student.user', 'user')
      .where('student.streamId = :streamId', { streamId })
      .andWhere('user.tenantId = :tenantId', { tenantId })
      .andWhere('student.isActive = :isActive', { isActive: true })
      .getMany();
  }
}
