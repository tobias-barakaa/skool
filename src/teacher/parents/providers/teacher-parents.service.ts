import { Injectable, UnauthorizedException } from '@nestjs/common';
import { TeacherParentsProvider } from '../providers/teacher-parents.provider';
import { ParentStudent } from 'src/admin/parent/entities/parent-student.entity';
import { Parent } from 'src/admin/parent/entities/parent.entity';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';

@Injectable()
export class TeacherParentsService {
  constructor(
    private readonly teacherParentsProvider: TeacherParentsProvider,
  ) {}

   private getTenantId(user: ActiveUserData): string {
      if (!user.tenantId) {
        throw new UnauthorizedException('Tenant ID is missing from the active user');
      }
      return user.tenantId;
    }

  async getParentsByTenant(user: ActiveUserData): Promise<Parent[]> {
    const tenantId = this.getTenantId(user);
    return await this.teacherParentsProvider.findParentsByTenant(tenantId);
  }

  async getParentsByStudentId(
    studentId: string,
    currentUser: ActiveUserData,
  ): Promise<Parent[]> {
    const tenantId = this.getTenantId(currentUser);
    return await this.teacherParentsProvider.findParentsByStudentId(
      studentId,
      tenantId,
    );
  }

  async getParentById(
    parentId: string,
    currentUser: ActiveUserData,
  ): Promise<Parent | null> {
    const tenantId = this.getTenantId(currentUser);
    return await this.teacherParentsProvider.findParentById(parentId, tenantId);
  }

  async getStudentParentRelationships(
    currentUser: ActiveUserData,
  ): Promise<ParentStudent[]> {
    return await this.teacherParentsProvider.findStudentParentRelationships(
      this.getTenantId(currentUser),
    );
  }

  async getPrimaryParentByStudentId(
    studentId: string,
    currentUser: ActiveUserData,
  ): Promise<Parent | null> {
    return await this.teacherParentsProvider.findPrimaryParentByStudentId(
      studentId,
      this.getTenantId(currentUser),
    );
  }

  // async getStudentsWithParents(tenantId: string): Promise<any[]> {
  //   const relationships = await this.getStudentParentRelationships(tenantId);

  //   // Group by student
  //   const studentsWithParents = relationships.reduce((acc, relationship) => {
  //     const studentId = relationship.studentId;

  //     if (!acc[studentId]) {
  //       acc[studentId] = {
  //         studentId,
  //         admissionNumber: relationship.student?.admission_number,
  //         parents: [],
  //       };
  //     }

  //     acc[studentId].parents.push({
  //       parentId: relationship.parentId,
  //       name: relationship.parent?.name,
  //       email: relationship.parent?.email,
  //       phone: relationship.parent?.phone,
  //       relationship: relationship.relationship,
  //       isPrimary: relationship.isPrimary,
  //     });

  //     return acc;
  //   }, {});

  //   return Object.values(studentsWithParents);
  // }

  async getStudentsWithParents(currentUser: ActiveUserData): Promise<any[]> {
    const relationships = await this.getStudentParentRelationships(currentUser);

    const studentMap: Record<string, any> = {};

    for (const rel of relationships) {
      if (!rel.student || !rel.parent) continue;

      const studentId = rel.student.id;

      if (!studentMap[studentId]) {
        studentMap[studentId] = {
          studentId,
          admissionNumber: rel.student.admission_number,
          gender: rel.student.gender,
          phone: rel.student.phone,
          grade: rel.student.grade?.gradeLevel.name ?? null,
          stream: rel.student.stream?.name ?? null,
          parents: [],
        };
      }

      studentMap[studentId].parents.push({
        parentId: rel.parent.id,
        name: rel.parent.name,
        email: rel.parent.email,
        phone: rel.parent.phone,
        relationship: rel.relationship,
        isPrimary: rel.isPrimary,
      });
    }

    return Object.values(studentMap);
  }
}
