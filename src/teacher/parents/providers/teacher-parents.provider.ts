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
      .innerJoin('parent.studentParents', 'studentParent')
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
      .innerJoin('studentParent.parent', 'parent')
      .innerJoin('studentParent.student', 'student')
      .innerJoin('student.user', 'user')
      .where('studentParent.tenantId = :tenantId', { tenantId })
      .andWhere('parent.isActive = :isActive', { isActive: true })
      .andWhere('user.tenantId = :tenantId', { tenantId })
      .select([
        'studentParent.id',
        'studentParent.parentId',
        'studentParent.studentId',
        'studentParent.relationship',
        'studentParent.isPrimary',
        'studentParent.tenantId',
        'studentParent.createdAt',
        'studentParent.updatedAt',
        'parent.name',
        'parent.email',
        'parent.phone',
        'student.admission_number',
      ])
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
