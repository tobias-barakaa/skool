// src/students/students.service.ts
import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { Repository } from 'typeorm';
import { CreateStudentInput } from '../dtos/create-student-input.dto';
import { CreateStudentResponse } from '../dtos/student-response.dto';
import { Student } from '../entities/student.entity';
import { StudentQueryProvider } from './student-query.provider';
import { UsersCreateStudentProvider } from './student.create.provider';
import { SchoolConfig } from 'src/admin/school-type/entities/school-config.entity';
import { MembershipRole, UserTenantMembership } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { SchoolSetupGuardService } from 'src/admin/config/school-config.guard';
import { StudentLoginInfo } from '../dtos/student-login-info.output';


@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

  constructor(
    private readonly usersCreateStudentProvider: UsersCreateStudentProvider,

    @InjectRepository(SchoolConfig)
    private readonly schoolConfigRepo: Repository<SchoolConfig>,

    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,

    @InjectRepository(UserTenantMembership)
    private readonly membershipRepository: Repository<UserTenantMembership>,

    private readonly studentQueryProvider: StudentQueryProvider,
    private readonly schoolSetupGuardService: SchoolSetupGuardService,
  ) {}

  async createStudent(
    createStudentInput: CreateStudentInput,
    currentUser: ActiveUserData,
  ): Promise<CreateStudentResponse> {
    // Verify that current user is a school admin
    const membership = await this.membershipRepository.findOne({
      where: {
        userId: currentUser.sub,
        role: MembershipRole.SCHOOL_ADMIN,
      },
      relations: ['tenant'],
    });

    if (!membership) {
      throw new ForbiddenException('Only school admins can create students');
    }

    // ✅ Enforce school setup is completed
    await this.schoolSetupGuardService.validateSchoolIsConfigured(
      membership.tenantId,
    );

    const isValidGrade =
      await this.schoolSetupGuardService.validateGradeLevelBelongsToTenant(
        membership.tenantId,
        createStudentInput.tenantGradeLevelId,
      );

    if (!isValidGrade) {
      throw new BadRequestException(
        `Grade level with ID ${createStudentInput.tenantGradeLevelId} is not part of the configured school for this tenant`,
      );
    }

    return this.usersCreateStudentProvider.createStudent(
      createStudentInput,
      currentUser,
    );
  }

  async getStudentsForTenant(currentUser: ActiveUserData): Promise<StudentLoginInfo[]> {

     const membership = await this.membershipRepository.findOne({
          where: {
            userId: currentUser.sub,
            role: MembershipRole.SCHOOL_ADMIN,
          },
        });

        if (!membership) {
          throw new ForbiddenException('Only school admins can create students');
        }

        const tenantId = membership.tenantId;

        await this.schoolSetupGuardService.validateSchoolIsConfigured(tenantId);

    const students = await this.studentRepository.find({
      where: { tenant_id: tenantId, isActive: true },
      relations: ['user', 'grade', 'grade.gradeLevel'],
    });

    return students.map((student) => ({
      id: student.id,
      email: student.user.email,
      name: student.user.name,
      admission_number: student.admission_number,
      grade: student.grade.gradeLevel.name,
    }));
  }

  // async getAllStudentsByTenant(tenantId: string): Promise<Student[]> {
  //   return this.studentQueryProvider.findAllByTenant(tenantId);
  // }

  async getGradeLevelsWithStreamsForTenant(tenantId: string): Promise<any[]> {
    const schoolConfig = await this.schoolConfigRepo
      .createQueryBuilder('config')
      .leftJoin('config.selectedLevels', 'schoolLevel')
      .leftJoin('schoolLevel.gradeLevels', 'gradeLevel')
      .leftJoin('gradeLevel.streams', 'stream')
      .addSelect([
        'schoolLevel.id',
        'schoolLevel.name',
        'gradeLevel.id',
        'gradeLevel.name',
        'stream.id',
        'stream.name',
      ])
      .where('config.tenantId = :tenantId', { tenantId })
      .getRawMany();

    // Group data into structure: gradeLevels: [{ id, name, streams: [] }]
    const gradeMap = new Map<
      string,
      { id: string; name: string; streams: any[] }
    >();

    for (const row of schoolConfig) {
      const gradeId = row['gradeLevel_id'];
      if (!gradeMap.has(gradeId)) {
        gradeMap.set(gradeId, {
          id: gradeId,
          name: row['gradeLevel_name'],
          streams: [],
        });
      }

      const streamId = row['stream_id'];
      if (streamId) {
        gradeMap.get(gradeId)!.streams.push({
          id: streamId,
          name: row['stream_name'],
        });
      }
    }

    return Array.from(gradeMap.values());
  }

  async findStudentsByTenant(tenantId: string): Promise<Student[]> {
    return this.studentRepository.find({
      where: {
        user: {
          memberships: {
            tenantId: tenantId,
          },
        },
      },
      relations: ['user'],
    });
  }

  async getAllStudentsByTenant(user: ActiveUserData): Promise<Student[]> {
    return this.studentRepository.find({
      where: {
        tenant_id: user.tenantId,
        isActive: true, // Optional: only get active students
      },
      relations: ['user', 'grade'],
      order: { createdAt: 'ASC' },
    });
  }

  async getStudentsByTenantGradeLevel(
    tenantGradeLevelId: string,
    user: ActiveUserData,
  ): Promise<Student[]> {
    return this.usersCreateStudentProvider.getStudentsByTenantGradeLevel(
      tenantGradeLevelId,
      user,
    );
  }

  async revokeStudent(
    studentId: string,
    currentUser: ActiveUserData,
  ): Promise<{ message: string }> {
    const membership = await this.membershipRepository.findOne({
      where: {
        userId: currentUser.sub,
        tenantId: currentUser.tenantId,
        role: MembershipRole.SCHOOL_ADMIN,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Only school admins can revoke students');
    }

    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: ['user'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    student.isActive = false;
    await this.studentRepository.save(student);

    return { message: 'Student revoked successfully' };
  }
}

