// attendance.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance } from '../entities/attendance.entity';
import { CreateAttendanceInput } from '../dtos/attendance.input';
import { Student } from 'src/admin/student/entities/student.entity';
import { MembershipRole, UserTenantMembership } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { GradeLevel } from 'src/admin/level/entities/grade-level.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(UserTenantMembership)
    private userTenantMembershipRepository: Repository<UserTenantMembership>,
    @InjectRepository(GradeLevel)
    private gradeLevelRepository: Repository<GradeLevel>,
  ) {}

  async markAttendance(
    markAttendanceInput: CreateAttendanceInput,
    teacherId: string,
    tenantId: string,
  ) {
    const { date, gradeId, attendanceRecords } = markAttendanceInput;

    // Validate date format
    if (!this.isValidDate(date)) {
      throw new BadRequestException('Invalid date format');
    }

    // 1. Verify grade exists
    const gradeExists = await this.gradeLevelRepository.findOne({
      where: { id: gradeId }
    });

    if (!gradeExists) {
      throw new BadRequestException('Grade level does not exist');
    }

    // 2. Verify teacher has permission for this tenant
    const teacherMembership = await this.userTenantMembershipRepository.findOne({
      where: {
        userId: teacherId,
        tenantId: tenantId,
        role: MembershipRole.TEACHER,
      },
    });

    if (!teacherMembership) {
      throw new BadRequestException('Teacher not authorized for this tenant');
    }

    // 3. Get all valid students for this grade and tenant using QueryBuilder
    const validStudents = await this.studentRepository
      .createQueryBuilder('student')
      .innerJoin('student.user', 'user')
      .innerJoin('user.userTenantMemberships', 'membership') // Adjust relation name
      .where('student.grade = :gradeId', { gradeId })
      .andWhere('membership.tenantId = :tenantId', { tenantId })
      .andWhere('membership.role = :role', { role: MembershipRole.STUDENT })
      .select([
        'student.id',
        'student.grade',
        'user.id',
        'user.name'
      ])
      .getMany();

    const validStudentIds = validStudents.map(s => s.id);

    // 4. Validate all studentIds from frontend
    const invalidStudents = attendanceRecords.filter(
      (record) => !validStudentIds.includes(record.studentId),
    );

    if (invalidStudents.length > 0) {
      throw new BadRequestException(
        `Invalid student IDs: ${invalidStudents.map(s => s.studentId).join(', ')}. Students must belong to grade ${gradeId} and tenant ${tenantId}`,
      );
    }

    // 5. Additional validation: Check each student individually
    for (const record of attendanceRecords) {
      const studentValidation = await this.validateStudentAccess(
        record.studentId,
        gradeId,
        tenantId
      );

      if (!studentValidation) {
        throw new BadRequestException(
          `Student ID ${record.studentId} is not authorized for this grade and tenant`
        );
      }
    }

    // 6. Delete existing attendance for this date/grade (if updating)
    await this.attendanceRepository.delete({
      date,
      gradeId,
      tenantId,
    });

    // 7. Create new attendance records
    const attendanceEntities = attendanceRecords.map((record) =>
      this.attendanceRepository.create({
        studentId: record.studentId,
        teacherId,
        tenantId,
        gradeId,
        date,
        status: record.status,
      }),
    );

    return this.attendanceRepository.save(attendanceEntities);
  }

  // Helper method to validate individual student access
  private async validateStudentAccess(
    studentId: string,
    gradeId: string,
    tenantId: string
  ): Promise<boolean> {
    const student = await this.studentRepository
      .createQueryBuilder('student')
      .innerJoin('student.user', 'user')
      .innerJoin('user.userTenantMemberships', 'membership')
      .where('student.id = :studentId', { studentId })
      .andWhere('student.grade = :gradeId', { gradeId })
      .andWhere('membership.tenantId = :tenantId', { tenantId })
      .andWhere('membership.role = :role', { role: MembershipRole.STUDENT })
      .getOne();

    return !!student;
  }

  async getAttendanceByDate(date: string, gradeId: string, tenantId: string) {
    return this.attendanceRepository.find({
      where: { date, gradeId, tenantId },
      relations: ['student', 'teacher'],
    });
  }

  // Get students for a specific grade and tenant
  async getStudentsByGrade(gradeId: string, tenantId: string) {
    return this.studentRepository
      .createQueryBuilder('student')
      .innerJoin('student.user', 'user')
      .innerJoin('user.userTenantMemberships', 'membership')
      .where('student.grade = :gradeId', { gradeId })
      .andWhere('membership.tenantId = :tenantId', { tenantId })
      .andWhere('membership.role = :role', { role: MembershipRole.STUDENT })
      .select([
        'student.id',
        'student.admissionNumber',
        'student.grade',
        'user.id',
        'user.name'
      ])
      .getMany();
  }

  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }
}
