import { Injectable } from '@nestjs/common';
import { TeacherParentsProvider } from '../providers/teacher-parents.provider';
import { ParentStudent } from 'src/admin/parent/entities/parent-student.entity';
import { Parent } from 'src/admin/parent/entities/parent.entity';

@Injectable()
export class TeacherParentsService {
  constructor(
    private readonly teacherParentsProvider: TeacherParentsProvider,
  ) {}

  async getParentsByTenant(tenantId: string): Promise<Parent[]> {
    return await this.teacherParentsProvider.findParentsByTenant(tenantId);
  }

  async getParentsByStudentId(
    studentId: string,
    tenantId: string,
  ): Promise<Parent[]> {
    return await this.teacherParentsProvider.findParentsByStudentId(
      studentId,
      tenantId,
    );
  }

  async getParentById(
    parentId: string,
    tenantId: string,
  ): Promise<Parent | null> {
    return await this.teacherParentsProvider.findParentById(parentId, tenantId);
  }

  async getStudentParentRelationships(
    tenantId: string,
  ): Promise<ParentStudent[]> {
    return await this.teacherParentsProvider.findStudentParentRelationships(
      tenantId,
    );
  }

  async getPrimaryParentByStudentId(
    studentId: string,
    tenantId: string,
  ): Promise<Parent | null> {
    return await this.teacherParentsProvider.findPrimaryParentByStudentId(
      studentId,
      tenantId,
    );
  }

  async getStudentsWithParents(tenantId: string): Promise<any[]> {
    const relationships = await this.getStudentParentRelationships(tenantId);

    // Group by student
    const studentsWithParents = relationships.reduce((acc, relationship) => {
      const studentId = relationship.studentId;

      if (!acc[studentId]) {
        acc[studentId] = {
          studentId,
          admissionNumber: relationship.student?.admission_number,
          parents: [],
        };
      }

      acc[studentId].parents.push({
        parentId: relationship.parentId,
        name: relationship.parent?.name,
        email: relationship.parent?.email,
        phone: relationship.parent?.phone,
        relationship: relationship.relationship,
        isPrimary: relationship.isPrimary,
      });

      return acc;
    }, {});

    return Object.values(studentsWithParents);
  }
}
