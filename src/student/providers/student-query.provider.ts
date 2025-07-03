// src/students/providers/studentQueryProvider.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Student } from '../entities/student.entity';
import { Repository } from 'typeorm';

@Injectable()
export class StudentQueryProvider {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>
  ) {}

  async findAllByTenant(tenantId: string): Promise<Student[]> {
    return this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoin('user.memberships', 'membership')
      .where('membership.tenantId = :tenantId', { tenantId })
      .getMany();
  }
}
