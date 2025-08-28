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
  userId: string, // This is the User ID from currentUser.sub
  tenantId: string,
) {

  await this.debugTeacherGradeAssignments(userId, tenantId);

  await this.schoolSetupGuardService.validateSchoolIsConfigured(tenantId);

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

  // Check user membership
  const teacherMembership = await this.userTenantMembershipRepository.findOne({
    where: {
      userId: userId, // This is correct - using User ID
      tenantId: tenantId,
      role: MembershipRole.TEACHER,
    },
  });

  if (!teacherMembership) {
    throw new BadRequestException('Teacher not authorized for this tenant');
  }

  // Fixed teacher query - find teacher by userId and check grade assignment
  const teacherRepo = this.dataSource.getRepository(Teacher);

  // First, let's find the teacher by userId
  const teacher = await teacherRepo.findOne({
    where: {
      userId: userId, // Use userId (from currentUser.sub)
      tenantId: tenantId,
    },
    relations: ['tenantGradeLevels'], // Load the grade levels
  });

  if (!teacher) {
    throw new BadRequestException(
      'Teacher profile not found for this user in this tenant',
    );
  }

  // Check if teacher is assigned to this grade
  const isAssignedToGrade = teacher.tenantGradeLevels?.some(
    (grade) => grade.id === gradeId,
  );

  if (!isAssignedToGrade) {
    // Debug logging
    console.log('Teacher ID:', teacher.id);
    console.log('Teacher User ID:', teacher.userId);
    console.log('Assigned Grade IDs:', teacher.tenantGradeLevels?.map(g => g.id));
    console.log('Requested Grade ID:', gradeId);

    throw new BadRequestException(
      `Teacher is not assigned to grade ${gradeId} in this tenant`,
    );
  }

  // Validate students
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

  // Delete existing attendance for this date/grade
  await this.attendanceRepository.delete({
    date,
    gradeId,
    tenantId,
  });

  // Create new attendance records - use teacher.id (not userId)
  const attendanceEntities = attendanceRecords.map((record) =>
    this.attendanceRepository.create({
      studentId: record.studentId,
      teacherId: teacher.id, // Use teacher.id, not userId
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


  async debugTeacherGradeAssignments(userId: string, tenantId: string) {
  const teacherRepo = this.dataSource.getRepository(Teacher);

  const teacher = await teacherRepo.findOne({
    where: {
      userId: userId,
      tenantId: tenantId,
    },
    relations: ['tenantGradeLevels', 'user'],
  });

  console.log('=== Teacher Debug Info ===');
  console.log('User ID:', userId);
  console.log('Tenant ID:', tenantId);
  console.log('Teacher found:', !!teacher);

  if (teacher) {
    console.log('Teacher ID:', teacher.id);
    console.log('Teacher User ID:', teacher.userId);
    console.log('Teacher Email:', teacher.email);
    console.log('Teacher Active:', teacher.isActive);
    console.log('Grade Level Assignments:');
    teacher.tenantGradeLevels?.forEach((grade, index) => {
      console.log(`  ${index + 1}. Grade ID: ${grade.id}`);
    });
  }

  return teacher;
}


}
