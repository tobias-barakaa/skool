import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ClassTeacherAssignment } from "../entities/class_teacher_assignments.entity";
import { DeepPartial, Repository } from "typeorm";
import { TenantStream } from "src/admin/school-type/entities/tenant-stream";
import { TenantGradeLevel } from "src/admin/school-type/entities/tenant-grade-level";
import { Teacher } from "../entities/teacher.entity";
import {  UnassignClassTeacherInput } from "../dtos/assign/assign-classTeacher.dto";

@Injectable()
export class ClassTeacherProvider {
  constructor(
    @InjectRepository(ClassTeacherAssignment)
    private assignmentRepo: Repository<ClassTeacherAssignment>,
    @InjectRepository(TenantStream)
    private tenantStreamRepo: Repository<TenantStream>,
    @InjectRepository(TenantGradeLevel)
    private tenantGradeLevelRepo: Repository<TenantGradeLevel>,
    @InjectRepository(Teacher)
    private teacherRepo: Repository<Teacher>,
  ) {}


  async assign(
    input: { teacherId: string; streamId?: string; gradeLevelId?: string; tenantId: string },
  ): Promise<ClassTeacherAssignment> {
    return this.assignmentRepo.manager.transaction(async (manager) => {
      
      // STEP 1: Validate that all referenced entities exist
      
      // Validate tenant exists
      const tenant = await manager.findOne('Tenant', { where: { id: input.tenantId } });
      if (!tenant) {
        throw new BadRequestException(`Tenant with ID ${input.tenantId} not found`);
      }
  
      // Validate teacher exists
      const teacher = await manager.findOne('Teacher', { where: { id: input.teacherId } });
      if (!teacher) {
        throw new BadRequestException(`Teacher with ID ${input.teacherId} not found`);
      }
  
      // Validate stream exists (if provided)
      if (input.streamId) {
        const stream = await manager.findOne('TenantStream', { where: { id: input.streamId } });
        if (!stream) {
          throw new BadRequestException(`Stream with ID ${input.streamId} not found`);
        }
      }
  
      // Validate grade level exists (if provided)
      if (input.gradeLevelId) {
        const gradeLevel = await manager.findOne('TenantGradeLevel', { where: { id: input.gradeLevelId } });
        if (!gradeLevel) {
          throw new BadRequestException(`Grade level with ID ${input.gradeLevelId} not found`);
        }
      }
  
      // STEP 2: Check if this exact assignment already exists and is active
      const existingAssignment = await manager.findOne(ClassTeacherAssignment, {
        where: {
          teacher: { id: input.teacherId },
          tenant: { id: input.tenantId },
          ...(input.streamId && { stream: { id: input.streamId } }),
          ...(input.gradeLevelId && { gradeLevel: { id: input.gradeLevelId } }),
          active: true,
        },
        relations: ['teacher', 'stream', 'gradeLevel'],
      });
  
      if (existingAssignment) {
        return existingAssignment; 
      }
  
      // STEP 3: Deactivate conflicting assignments
      
      // Handle stream conflicts
      if (input.streamId) {
        const conflictingStreamAssignments = await manager.find(ClassTeacherAssignment, {
          where: { 
            stream: { id: input.streamId }, 
            active: true 
          }
        });
  
        for (const assignment of conflictingStreamAssignments) {
          assignment.active = false;
          assignment.endDate = new Date();
          await manager.save(assignment);
        }
      }
  
      // Handle grade level conflicts
      if (input.gradeLevelId) {
        const conflictingGradeLevelAssignments = await manager.find(ClassTeacherAssignment, {
          where: { 
            gradeLevel: { id: input.gradeLevelId }, 
            active: true 
          }
        });
  
        for (const assignment of conflictingGradeLevelAssignments) {
          assignment.active = false;
          assignment.endDate = new Date();
          await manager.save(assignment);
        }
      }
  
      // Handle teacher conflicts
      const conflictingTeacherAssignments = await manager.find(ClassTeacherAssignment, {
        where: { 
          teacher: { id: input.teacherId }, 
          active: true 
        }
      });
  
      for (const assignment of conflictingTeacherAssignments) {
        assignment.active = false;
        assignment.endDate = new Date();
        await manager.save(assignment);
      }
  
      // STEP 4: Create new assignment
      const newAssignment = manager.create(
        ClassTeacherAssignment,
        {
          tenant: { id: input.tenantId },
          teacher: { id: input.teacherId },
          stream: input.streamId ? { id: input.streamId } : undefined,
          gradeLevel: input.gradeLevelId ? { id: input.gradeLevelId } : undefined,
          active: true,
          startDate: new Date(),
        } as DeepPartial<ClassTeacherAssignment>
      );
  
      const savedAssignment = await manager.save(newAssignment);
  
      // STEP 5: Fetch with relations
      const assignmentWithRelations = await manager.findOne(ClassTeacherAssignment, {
        where: { id: savedAssignment.id },
        relations: ['teacher', 'stream', 'gradeLevel'],
      });
  
      if (!assignmentWithRelations) {
        throw new BadRequestException('Failed to create assignment');
      }
  
      return assignmentWithRelations;
    });
  }
  

  async findExistingAssignment(input: {
    teacherId: string;
    streamId?: string;
    gradeLevelId?: string;
    tenantId: string;
  }): Promise<ClassTeacherAssignment | null> {
    return await this.assignmentRepo.findOne({
      where: {
        teacher: { id: input.teacherId },
        tenant: { id: input.tenantId },
        ...(input.streamId && { stream: { id: input.streamId } }),
        ...(input.gradeLevelId && { gradeLevel: { id: input.gradeLevelId } }),
        active: true,
      },
      relations: ['teacher', 'stream', 'gradeLevel'],
    });
  }


  async unassign(input: { teacherId: string; tenantId: string }): Promise<void> {
    return await this.assignmentRepo.manager.transaction(async (transactionalEntityManager) => {
      
      const assignment = await transactionalEntityManager.findOne(ClassTeacherAssignment, {
        where: {
          teacher: { id: input.teacherId },
          tenant: { id: input.tenantId },
          active: true,
        },
      });
  
      if (!assignment) {
        throw new BadRequestException(
          `No active class teacher assignment found for teacher '${input.teacherId}'`
        );
      }
  
      await transactionalEntityManager.delete(ClassTeacherAssignment, {
        teacher: { id: input.teacherId },
        tenant: { id: input.tenantId },
        active: false,
      });
  
      assignment.active = false;
      assignment.endDate = new Date();
      await transactionalEntityManager.save(assignment);
    });
  }

}


