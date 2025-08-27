// attendance.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Attendance } from '../entities/attendance.entity';
import { CreateAttendanceInput } from '../dtos/attendance.input';
import { Student } from 'src/admin/student/entities/student.entity';
import { MembershipRole, UserTenantMembership } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { TenantGradeLevel } from 'src/admin/school-type/entities/tenant-grade-level';
import { SchoolSetupGuardService } from 'src/admin/config/school-config.guard';
import { Teacher } from 'src/admin/teacher/entities/teacher.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(UserTenantMembership)
    private userTenantMembershipRepository: Repository<UserTenantMembership>,
    private readonly schoolSetupGuardService: SchoolSetupGuardService,
    private readonly dataSource: DataSource,

  ) {}


  async markAttendance(
    markAttendanceInput: CreateAttendanceInput,
    teacherId: string,
    tenantId: string,
  ) {
    await this.schoolSetupGuardService.validateSchoolIsConfigured(
      tenantId
    );

    const { date, gradeId, attendanceRecords } = markAttendanceInput;

    if (!this.isValidDate(date)) {
      throw new BadRequestException('Invalid date format');
    }

    const gradeRepo = this.dataSource.getRepository(TenantGradeLevel);
    const gradeExists = await gradeRepo.findOne({
      where: {
        id: gradeId,
        tenant: { id: tenantId },
      },
      relations: ['tenant', 'gradeLevel'],
    });

   if (!gradeExists) {
     throw new BadRequestException(
       `Grade level does not exist for tenant ${tenantId}`,
     );
   }

    const teacherMembership = await this.userTenantMembershipRepository.findOne(
      {
        where: {
          userId: teacherId,
          tenantId: tenantId,
          role: MembershipRole.TEACHER,
        },
      },
    );

    if (!teacherMembership) {
      throw new BadRequestException('Teacher not authorized for this tenant');
    }


    const teacherRepo = this.dataSource.getRepository(Teacher);

    const teacher = await teacherRepo.findOne({
      where: {
        userId: teacherId,
        tenantId: tenantId,
        tenantGradeLevels: { id: gradeId },
      },
      relations: ['tenantGradeLevels'],
    });

    if (!teacher) {
      throw new BadRequestException(
        `Teacher is not assigned to grade ${gradeId} in this tenant`,
      );
    }
    const validStudents = await this.studentRepository
      .createQueryBuilder('student')
      .innerJoin('student.user', 'user')
      .innerJoin('user.memberships', 'membership')
      .where('student.grade = :gradeId', { gradeId })
      .andWhere('membership.tenantId = :tenantId', { tenantId })
      .andWhere('membership.role = :role', { role: MembershipRole.STUDENT })
      .select(['student.id', 'student.grade', 'user.id', 'user.name'])
      .getMany();

    const validStudentIds = validStudents.map((s) => s.id);

    const invalidStudents = attendanceRecords.filter(
      (record) => !validStudentIds.includes(record.studentId),
    );

    if (invalidStudents.length > 0) {
      throw new BadRequestException(
        `Invalid student IDs: ${invalidStudents.map((s) => s.studentId).join(', ')}. Students must belong to grade ${gradeId} and tenant ${tenantId}`,
      );
    }

    for (const record of attendanceRecords) {
      const studentValidation = await this.validateStudentAccess(
        record.studentId,
        gradeId,
        tenantId,
      );

      if (!studentValidation) {
        throw new BadRequestException(
          `Student ID ${record.studentId} is not authorized for this grade and tenant`,
        );
      }
    }

    await this.attendanceRepository.delete({
      date,
      gradeId,
      tenantId,
    });

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

    const saved = await this.attendanceRepository.save(attendanceEntities);

    return this.attendanceRepository.find({
      where: { id: In(saved.map((a) => a.id)) },
      relations: ['student'],
    });
  }

  private async validateStudentAccess(
    studentId: string,
    gradeId: string,
    tenantId: string,
  ): Promise<boolean> {
    const student = await this.studentRepository
      .createQueryBuilder('student')
      .innerJoin('student.user', 'user')
      .innerJoin('user.memberships', 'membership')
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

  async getStudentsByGrade(gradeId: string, tenantId: string) {
    return this.studentRepository
      .createQueryBuilder('student')
      .innerJoin('student.user', 'user')
      .innerJoin('user.memberships', 'membership')
      .where('student.grade = :gradeId', { gradeId })
      .andWhere('membership.tenantId = :tenantId', { tenantId })
      .andWhere('membership.role = :role', { role: MembershipRole.STUDENT })
      .select([
        'student.id',
        'student.admissionNumber',
        'student.grade',
        'user.id',
        'user.name',
      ])
      .getMany();
  }

  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }
}
