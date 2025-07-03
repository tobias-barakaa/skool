// src/students/students.service.ts
import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersCreateStudentProvider } from './student.create.provider';
import { Student } from '../entities/student.entity';
import { MembershipRole, UserTenantMembership } from 'src/user-tenant-membership/entities/user-tenant-membership.entity';
import { CreateStudentInput } from '../dtos/create-student-input.dto';
import { User } from 'src/users/entities/user.entity';
import { CreateStudentResponse } from '../dtos/student-response.dto';
import { ActiveUserData } from 'src/auth/interface/active-user.interface';
import { StudentQueryProvider } from './student-query.provider';

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

  constructor(
    private readonly usersCreateStudentProvider: UsersCreateStudentProvider,

    
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    
    @InjectRepository(UserTenantMembership)
    private readonly membershipRepository: Repository<UserTenantMembership>,

    private readonly studentQueryProvider: StudentQueryProvider
  ) {}

  async createStudent(
    createStudentInput: CreateStudentInput,
    currentUser: ActiveUserData
  ): Promise<CreateStudentResponse> {
    // Verify that current user is a school admin
    const membership = await this.membershipRepository.findOne({
      where: { 
        userId: currentUser.sub,
        role: MembershipRole.SCHOOL_ADMIN 
      },
      relations: ['tenant']
    });

    if (!membership) {
      throw new ForbiddenException('Only school admins can create students');
    }

    return this.usersCreateStudentProvider.createStudent(
      createStudentInput,
      membership.tenantId,
      currentUser.subdomain
    );
  }

  async getAllStudentsByTenant(tenantId: string): Promise<Student[]> {
    return this.studentQueryProvider.findAllByTenant(tenantId);
  }

  async createMultipleStudents(
    studentsData: CreateStudentInput[],
    currentUser: ActiveUserData
  ): Promise<CreateStudentResponse[]> {
    // Verify that current user is a school admin
    const membership = await this.membershipRepository.findOne({
      where: { 
        userId: currentUser.sub,
        role: MembershipRole.SCHOOL_ADMIN 
      },
      relations: ['tenant']
    });

    if (!membership) {
      throw new ForbiddenException('Only school admins can create students');
    }

    return this.usersCreateStudentProvider.createMultipleStudents(
      studentsData,
      membership.tenantId,
      currentUser.subdomain
    );
  }

  async findStudentsByTenant(tenantId: string): Promise<Student[]> {
    return this.studentRepository.find({
      where: { 
        user: { 
          memberships: { 
            tenantId: tenantId 
          } 
        } 
      },
      relations: ['user']
    });
  }
}