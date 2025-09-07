// src/students/student-profile.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import { UserTenantMembership, MembershipRole } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { Student } from 'src/admin/student/entities/student.entity';

@Injectable()
export class StudentProfileService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserTenantMembership)
    private readonly membershipRepository: Repository<UserTenantMembership>,
  ) {}

  async getStudentProfile(userId: string): Promise<Student> {
    const userMembership = await this.membershipRepository.findOne({
      where: { 
        userId,
        role: MembershipRole.STUDENT 
      },
      relations: ['user', 'tenant'],
    });

    if (!userMembership) {
      throw new ForbiddenException('Access denied. User is not a student or does not exist.');
    }

    const student = await this.studentRepository.findOne({
      where: { 
        user_id: userId,
        tenant_id: userMembership.tenantId,
        isActive: true 
      },
      relations: [
        'user',
        'tenant',
        'grade',
        'grade.gradeLevel',
        'grade.curriculum',
        'stream',
        // The error is caused by the lines below.
        // The relations are correct, but the `AssessmentMark` entity is missing the `subject` relation.
        'marks',
        'marks.assessment',
        'marks.subject',
        
        'hostelAssignments',
        'hostelAssignments.hostel',
        'hostelAssignments.room',
        
        'transportRoute',
        'transportAssignments',
        'transportAssignments.transportRoute',
      
        'scholarships',
        'studentScholarships',
        'studentScholarships.scholarship',
      ],
    });

    if (!student) {
      throw new NotFoundException('Student profile not found.');
    }

    return student;
  }

  async getStudentById(studentId: string, currentUserId: string): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { 
        id: studentId,
        isActive: true 
      },
      relations: ['user'],
    });

    if (!student) {
      throw new NotFoundException('Student not found.');
    }

    if (student.user_id !== currentUserId) {
      throw new ForbiddenException('Access denied. You can only access your own student profile.');
    }

    return this.getStudentProfile(currentUserId);
  }

  async getStudentAcademicSummary(userId: string): Promise<any> {
    const student = await this.getStudentProfile(userId);
    
    const totalMarks = student.marks?.length || 0;
    const averageScore = student.marks?.length > 0 
      ? student.marks.reduce((sum, mark) => sum + mark.score, 0) / student.marks.length 
      : 0;

    return {
      student,
      academicSummary: {
        totalAssessments: totalMarks,
        averageScore: Math.round(averageScore * 100) / 100,
        currentGrade: student.grade?.gradeLevel?.name,
        currentStream: student.stream?.name,
        feesOwed: student.feesOwed,
        totalFeesPaid: student.totalFeesPaid,
        schoolType: student.schoolType,
      }
    };
  }

  async getStudentServices(userId: string): Promise<any> {
    const student = await this.getStudentProfile(userId);
  
    return {
      student,
      services: {
        hostel: {
          isAssigned: (student.hostelAssignments ?? []).length > 0,
          assignments: student.hostelAssignments ?? [],
        },
        transport: {
          assignments: student.transportAssignments ?? [],
        },
        scholarship: {
          scholarshipHistory: student.studentScholarships ?? [],
        },
      },
    };
  }
}