import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Scholarship } from './entities/scholarship.entity';
import { CreateScholarshipInput } from './dtos/create-scholarship.input';
import { UpdateScholarshipInput } from './dtos/update-scholarship.input';
import { Roles } from 'src/iam/decorators/roles.decorator';
import { MembershipRole } from '../user-tenant-membership/entities/user-tenant-membership.entity';
import { StudentScholarship } from './entities/scholarship_assignments.entity';
import { AssignScholarshipInput } from './dtos/assign-scholarship.input';
import { Student } from '../student/entities/student.entity';
import { UpdateStudentScholarshipInput } from './dtos/update-student-scholarship.input';
import { ActiveUserData } from '../auth/interface/active-user.interface';

@Injectable()
@Roles(MembershipRole.SCHOOL_ADMIN)
export class ScholarshipsService {
  constructor(
    @InjectRepository(Scholarship)
    private readonly scholarshipRepo: Repository<Scholarship>,
    @InjectRepository(StudentScholarship)
    private readonly studentScholarshipRepo: Repository<StudentScholarship>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,

    
  ) {}

  async create(input: CreateScholarshipInput, user: ActiveUserData): Promise<Scholarship> {


    const existing = await this.scholarshipRepo.findOne({
      where: { name: input.name, tenantId: user.tenantId },
    });
  
    if (existing) {
      throw new ConflictException(`Scholarship with the name "${input.name}" already exists.`);
    }
  
    const scholarship = this.scholarshipRepo.create({
      ...input,
      tenantId: user.tenantId,
      type: input.type ?? 'FIXED',
    });
  
    return this.scholarshipRepo.save(scholarship);
  }
  
  
  async findAll(user: ActiveUserData): Promise<Scholarship[]> {
    return this.scholarshipRepo.find({
      where: { tenantId: user.tenantId },
      relations: ['studentScholarships', 'studentScholarships.student', 'studentScholarships.student.user'], // optional, if you want eager student info
      order: { createdAt: 'DESC' },
    });
  }
  

  async findOne(id: string): Promise<Scholarship> {
    const scholarship = await this.scholarshipRepo.findOne({ where: { id } });
    if (!scholarship) throw new NotFoundException(`Scholarship ${id} not found`);
    return scholarship;
  }

  async update(input: UpdateScholarshipInput, user: ActiveUserData): Promise<Scholarship> {
    const scholarship = await this.scholarshipRepo.findOne({
      where: { id: input.id, tenantId: user.tenantId },
    });
  
    if (!scholarship) {
      throw new NotFoundException('Scholarship not found or does not belong to this tenant');
    }
  
    if (input.name !== undefined) {
      scholarship.name = input.name;
    }
    if (input.description !== undefined) {
      scholarship.description = input.description;
    }
    if (input.amount !== undefined) {
      scholarship.amount = input.amount;
    }
    if (input.type !== undefined) {
      scholarship.type = input.type;
    }
  
    if (!scholarship.type) {
      scholarship.type = 'FIXED';
    }
  
    return this.scholarshipRepo.save(scholarship);
  }
  
  

  async remove(id: string): Promise<boolean> {
    await this.scholarshipRepo.delete(id);
    return true;
  }



  // ASSIGNE

async assignScholarship(
  input: AssignScholarshipInput,
  user: ActiveUserData,
): Promise<StudentScholarship> {
  const student = await this.studentRepo.findOne({
    where: { id: input.studentId, tenant_id: user.tenantId },
  });
  if (!student) {
    throw new NotFoundException('Student not found in this tenant');
  }

  const scholarship = await this.scholarshipRepo.findOne({
    where: { id: input.scholarshipId, tenantId: user.tenantId },
  });
  if (!scholarship) {
    throw new NotFoundException('Scholarship not found in this tenant');
  }

  const existing = await this.studentScholarshipRepo.findOne({
    where: {
      student: { id: input.studentId },
      scholarship: { id: input.scholarshipId },
      academicYear: input.academicYear,
    },
  });
  if (existing) {
    throw new BadRequestException('Student already has this scholarship for the academic year');
  }

  const assignment = this.studentScholarshipRepo.create({
    student,
    scholarship,
    academicYear: input.academicYear,
    status: 'ACTIVE',
  });

  return this.studentScholarshipRepo.save(assignment);
}


async findAssignmentsByStudent(studentId: string, user: ActiveUserData): Promise<StudentScholarship[]> {
  return this.studentScholarshipRepo.find({
    where: {
      student: { id: studentId, tenant_id: user.tenantId },
    },
    relations: ['scholarship', 'student'],
    order: { awardedAt: 'DESC' },
  });
}


async findAllAssignments(user: ActiveUserData): Promise<StudentScholarship[]> {
  return this.studentScholarshipRepo.find({
    where: {
      student: { tenant_id: user.tenantId },
    },
    relations: ['scholarship', 'student', 'student.user'],
    order: { awardedAt: 'DESC' },
  });
};


async updateAssignment(
  input: UpdateStudentScholarshipInput,
  user: ActiveUserData,
): Promise<StudentScholarship> {
  const assignment = await this.studentScholarshipRepo.findOne({
    where: { id: input.id, student: { tenant_id: user.tenantId } },
    relations: ['student'],
  });

  if (!assignment) {
    throw new NotFoundException('Student scholarship assignment not found');
  }

  if (input.academicYear !== undefined) {
    assignment.academicYear = input.academicYear;
  }
  if (input.status !== undefined) {
    assignment.status = input.status;
  }

  return this.studentScholarshipRepo.save(assignment);
}




async removeAssignment(id: string, user: ActiveUserData): Promise<boolean> {
  const assignment = await this.studentScholarshipRepo.findOne({
    where: { id, student: { tenant_id: user.tenantId } },
    relations: ['student'],
  });

  if (!assignment) {
    throw new NotFoundException('Student scholarship assignment not found');
  }

  await this.studentScholarshipRepo.remove(assignment);
  return true;
}




}








