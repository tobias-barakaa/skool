import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Hostel } from './entities/hostel.entity';
import { CreateHostelInput } from './dtos/create-hostel.input';
import { UpdateHostelInput } from './dtos/update-hostel.input';
import { Roles } from 'src/iam/decorators/roles.decorator';
import { MembershipRole } from '../user-tenant-membership/entities/user-tenant-membership.entity';
import { CreateHostelAssignmentInput } from './dtos/create-hostel-assignment.input';
import { HostelAssignment } from './entities/hostel.assignment';
import { UpdateHostelAssignmentInput } from './dtos/upsate-hostel-assignment.input';
import { Student } from '../student/entities/student.entity';

@Injectable()
@Roles(MembershipRole.SCHOOL_ADMIN)
export class HostelService {
  constructor(
    @InjectRepository(Hostel)
    private hostelRepository: Repository<Hostel>,
    @InjectRepository(HostelAssignment)
    private hostelAssignmentRepo: Repository<HostelAssignment>,
    private readonly manager: EntityManager
  ) {}

  async findAll(tenantId: string): Promise<Hostel[]> {
    return this.hostelRepository.find({ where: { tenantId } });
  }

  async create(input: CreateHostelInput, tenantId: string): Promise<Hostel> {
    const hostel = this.hostelRepository.create({ ...input, tenantId });
    return this.hostelRepository.save(hostel);
  }

  async findOne(id: string): Promise<Hostel> {
    const hostel = await this.hostelRepository.findOne({ where: { id } });
    if (!hostel) {
      throw new Error(`Hostel with id ${id} not found`);
    }
    return hostel;
  }

  async update(input: UpdateHostelInput): Promise<Hostel> {
    const hostel = await this.hostelRepository.preload(input);
    if (!hostel) {
      throw new NotFoundException(`Hostel with id ${input.id} not found`);
    }
    return this.hostelRepository.save(hostel);
  }

  async remove(id: string): Promise<boolean> {
    await this.hostelRepository.delete(id);
    return true;
  }



  // HOSTEL ASSIGNMENT METHODS BELOW

  async assignStudent(
    input: CreateHostelAssignmentInput,
    tenantId: string,
  ): Promise<HostelAssignment> {
    const student = await this.manager.findOne(Student, {
      where: { id: input.studentId, tenant_id: tenantId },
      relations: ['user'], 
    });
    if (!student) {
      throw new Error('Student not found or does not belong to this tenant');
    }

    const hostel = await this.manager.findOne(Hostel, {
      where: { id: input.hostelId, tenantId },
    });
    if (!hostel) {
      throw new Error('Hostel not found or does not belong to this tenant');
    }

    const assignment = this.manager.create(HostelAssignment, {
      ...input,
      tenantId,
      student,
      hostel,
    });

    return this.manager.save(HostelAssignment, assignment);
  }
  async updateAssignment(
    input: UpdateHostelAssignmentInput,
  ): Promise<HostelAssignment> {
    await this.hostelAssignmentRepo.update(input.id, input);
    const updated = await this.hostelAssignmentRepo.findOne({
      where: { id: input.id },
      relations: ['student', 'student.user', 'hostel'],
    });
    if (!updated) throw new NotFoundException('Assignment not found');
    return updated;
  }

  async removeAssignment(id: string): Promise<boolean> {
    const result = await this.hostelAssignmentRepo.delete(id);
  
    if (result.affected === 0) {
      throw new NotFoundException(`HostelAssignment with id ${id} not found`);
    }
  
    return true;
  }

  async getAssignmentsByHostel(
    hostelId: string,
    tenantId: string,
  ): Promise<HostelAssignment[]> {
    return this.hostelAssignmentRepo.find({
      where: { hostel: { id: hostelId }, tenantId },
      relations: ['student', 'student.user', 'hostel'],
    });
  }
}


