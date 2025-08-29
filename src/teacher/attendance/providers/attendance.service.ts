// attendance.service.ts
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Attendance } from '../entities/attendance.entity';
import { CreateAttendanceInput } from '../dtos/attendance.input';
import { Student } from 'src/admin/student/entities/student.entity';
import { MembershipRole, UserTenantMembership } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { TenantGradeLevel } from 'src/admin/school-type/entities/tenant-grade-level';
import { SchoolSetupGuardService } from 'src/admin/config/school-config.guard';
import { Teacher } from 'src/admin/teacher/entities/teacher.entity';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

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
    currentUser: ActiveUserData,
  ): Promise<Attendance[]> {
    const { date, gradeId, attendanceRecords } = markAttendanceInput;
    const userId = currentUser.sub;
    const tenantId = currentUser.tenantId;

    this.logger.log(`Marking attendance for grade ${gradeId} on ${date} by user ${userId}`);

    try {
      // Validate input
      this.validateAttendanceInput(markAttendanceInput);

      // Use transaction for data consistency
      return await this.dataSource.transaction(async (manager) => {
        const attendanceRepo = manager.getRepository(Attendance);
        const teacherRepo = manager.getRepository(Teacher);
        const studentRepo = manager.getRepository(Student);
        const gradeRepo = manager.getRepository(TenantGradeLevel);
        const membershipRepo = manager.getRepository(UserTenantMembership);

        // Validate permissions and relationships
        const [teacher, grade, students] = await Promise.all([
          this.validateTeacherPermissions(userId, tenantId, gradeId, teacherRepo, membershipRepo),
          this.validateGrade(gradeId, tenantId, gradeRepo),
          this.validateStudents(attendanceRecords.map(r => r.studentId), gradeId, tenantId, studentRepo, membershipRepo),
        ]);

        // Delete existing attendance for this date and grade
        await attendanceRepo.delete({ date, gradeId, tenantId });

        // Create new attendance records
        const attendanceEntities = attendanceRecords.map((record) =>
          attendanceRepo.create({
            studentId: record.studentId,
            teacherId: teacher.id,
            tenantId,
            gradeId,
            date,
            status: record.status,
          }),
        );

        const savedAttendance = await attendanceRepo.save(attendanceEntities);

        return attendanceRepo.find({
          where: { id: In(savedAttendance.map(a => a.id)) },
          relations: ['student'],
        });
      });
    } catch (error) {
      this.logger.error(`Failed to mark attendance:`, error);
      throw error;
    }
  }

  private validateAttendanceInput(input: CreateAttendanceInput): void {
    if (!input.date || !this.isValidDate(input.date)) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    if (!input.gradeId) {
      throw new BadRequestException('Grade ID is required');
    }

    if (!input.attendanceRecords || input.attendanceRecords.length === 0) {
      throw new BadRequestException('At least one attendance record is required');
    }

    // Check for duplicate student IDs
    const studentIds = input.attendanceRecords.map(r => r.studentId);
    const uniqueStudentIds = [...new Set(studentIds)];
    if (studentIds.length !== uniqueStudentIds.length) {
      throw new BadRequestException('Duplicate student IDs found in attendance records');
    }
  }

  private async validateTeacherPermissions(
    userId: string,
    tenantId: string,
    gradeId: string,
    teacherRepo: Repository<Teacher>,
    membershipRepo: Repository<UserTenantMembership>,
  ): Promise<Teacher> {
    // Check user membership
    const membership = await membershipRepo.findOne({
      where: { userId, tenantId, role: MembershipRole.TEACHER },
    });

    if (!membership) {
      throw new BadRequestException('User is not authorized as a teacher in this tenant');
    }

    console.log('Membership found:', membership);
    console.log('Membership found:', membership);
    console.log(userId,'userrdkjfijd...')
    this.logger.log(`Membership found for user ${userId} in tenant ${tenantId}`);

    // Find teacher profile
    const teacher = await teacherRepo.findOne({
      where: { user: { id: userId }, tenantId },
      relations: ['tenantGradeLevels', 'user'],
    });

    if (!teacher) {
      throw new BadRequestException('Teacher profile not found for this user');
    }

    if (!teacher.isActive) {
      throw new BadRequestException('Teacher profile is not active');
    }

    // Check grade assignment
    const isAssignedToGrade = teacher.tenantGradeLevels?.some(
      (grade) => grade.id === gradeId,
    );

    if (!isAssignedToGrade) {
      this.logger.warn(
        `Teacher ${teacher.id} (user: ${userId}) not assigned to grade ${gradeId}. ` +
        `Assigned grades: ${teacher.tenantGradeLevels?.map(g => g.id).join(', ')}`
      );
      throw new BadRequestException(
        `Teacher is not assigned to grade ${gradeId} in this tenant`,
      );
    }

    return teacher;
  }

  private async validateGrade(
    gradeId: string,
    tenantId: string,
    gradeRepo: Repository<TenantGradeLevel>,
  ): Promise<TenantGradeLevel> {
    const grade = await gradeRepo.findOne({
      where: { id: gradeId, tenant: { id: tenantId } },
      relations: ['tenant'],
    });

    if (!grade) {
      throw new BadRequestException(
        `Grade level ${gradeId} does not exist in tenant ${tenantId}`,
      );
    }

    return grade;
  }

  private async validateStudents(
    studentIds: string[],
    gradeId: string,
    tenantId: string,
    studentRepo: Repository<Student>,
    membershipRepo: Repository<UserTenantMembership>,
  ): Promise<Student[]> {
    const students = await studentRepo
      .createQueryBuilder('student')
      .innerJoin('student.user', 'user')
      .innerJoin('user.memberships', 'membership')
      .where('student.id IN (:...studentIds)', { studentIds })
      .andWhere('student.grade = :gradeId', { gradeId })
      .andWhere('membership.tenantId = :tenantId', { tenantId })
      .andWhere('membership.role = :role', { role: MembershipRole.STUDENT })
      .select(['student.id', 'student.grade', 'user.id', 'user.name'])
      .getMany();

    const foundStudentIds = students.map(s => s.id);
    const missingStudentIds = studentIds.filter(id => !foundStudentIds.includes(id));

    if (missingStudentIds.length > 0) {
      throw new BadRequestException(
        `Invalid student IDs: ${missingStudentIds.join(', ')}. ` +
        `Students must belong to grade ${gradeId} and tenant ${tenantId}`,
      );
    }

    return students;
  }

  private isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  async getAttendanceByGradeAndDate(
    gradeId: string,
    date: string,
    tenantId: string,
  ): Promise<Attendance[]> {
    return this.attendanceRepository.find({
      where: { gradeId, date, tenantId },
      relations: ['student', 'teacher'],
      order: { createdAt: 'DESC' },
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


  async debugTeacherGradeAssignments(userId: string, tenantId: string) {
  const teacherRepo = this.dataSource.getRepository(Teacher);

  const teacher = await teacherRepo.findOne({
    where: {
        user: { id: userId },
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
    console.log('Teacher User ID:', teacher.user?.id);
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
