import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ParentStudent } from 'src/admin/parent/entities/parent-student.entity';
import { Parent } from 'src/admin/parent/entities/parent.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TeacherParentsProvider {
  constructor(
    @InjectRepository(Parent)
    private readonly parentRepository: Repository<Parent>,
    @InjectRepository(ParentStudent)
    private readonly studentParentRepository: Repository<ParentStudent>,
  ) {}

  async findParentsByTenant(tenantId: string): Promise<Parent[]> {
    return await this.parentRepository
      .createQueryBuilder('parent')
      .where('parent.tenantId = :tenantId', { tenantId })
      .andWhere('parent.isActive = :isActive', { isActive: true })
      .select([
        'parent.id',
        'parent.name',
        'parent.email',
        'parent.phone',
        'parent.address',
        'parent.occupation',
        'parent.userId',
        'parent.tenantId',
        'parent.createdAt',
        'parent.updatedAt',
      ])
      .getMany();
  }

  async findParentsByStudentId(
    studentId: string,
    tenantId: string,
  ): Promise<Parent[]> {
    return await this.parentRepository
      .createQueryBuilder('parent')
      .innerJoin('parent.parentStudents', 'studentParent')
      .where('studentParent.studentId = :studentId', { studentId })
      .andWhere('parent.tenantId = :tenantId', { tenantId })
      .andWhere('parent.isActive = :isActive', { isActive: true })
      .select([
        'parent.id',
        'parent.name',
        'parent.email',
        'parent.phone',
        'parent.address',
        'parent.occupation',
        'parent.userId',
        'parent.tenantId',
        'parent.createdAt',
        'parent.updatedAt',
        'studentParent.relationship',
        'studentParent.isPrimary',
      ])
      .getMany();
  }

  async findParentById(
    parentId: string,
    tenantId: string,
  ): Promise<Parent | null> {
    return await this.parentRepository
      .createQueryBuilder('parent')
      .where('parent.id = :parentId', { parentId })
      .andWhere('parent.tenantId = :tenantId', { tenantId })
      .andWhere('parent.isActive = :isActive', { isActive: true })
      .getOne();
  }

  async findStudentParentRelationships(
    tenantId: string,
  ): Promise<ParentStudent[]> {
    return await this.studentParentRepository
      .createQueryBuilder('studentParent')
      .leftJoinAndSelect('studentParent.parent', 'parent')
      .leftJoinAndSelect('studentParent.student', 'student')
      .leftJoinAndSelect('student.grade', 'grade')
      .leftJoinAndSelect('student.stream', 'stream')
      .leftJoinAndSelect('student.user', 'user')
      .where('studentParent.tenantId = :tenantId', { tenantId })
      .andWhere('parent.isActive = :isActive', { isActive: true })
      // ⚠️ only use this if every student has a linked user
      // .andWhere('user.tenantId = :tenantId', { tenantId })
      .getMany();
  }

  async findPrimaryParentByStudentId(
    studentId: string,
    tenantId: string,
  ): Promise<Parent | null> {
    return await this.parentRepository
      .createQueryBuilder('parent')
      .innerJoin('parent.studentParents', 'studentParent')
      .where('studentParent.studentId = :studentId', { studentId })
      .andWhere('studentParent.isPrimary = :isPrimary', { isPrimary: true })
      .andWhere('parent.tenantId = :tenantId', { tenantId })
      .andWhere('parent.isActive = :isActive', { isActive: true })
      .getOne();
  }
}
