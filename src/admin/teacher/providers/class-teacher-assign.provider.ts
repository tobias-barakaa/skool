import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ClassTeacherAssignment } from "../entities/class_teacher_assignments.entity";
import { Repository } from "typeorm";
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



  async assign(input: {
    teacherId: string;
    streamId?: string;
    gradeLevelId?: string;
    tenantId: string;
  }): Promise<ClassTeacherAssignment> {
    return await this.assignmentRepo.manager.transaction(async (manager) => {
  
      // Deactivate any active assignments for this stream (other teachers)
      if (input.streamId) {
        await manager.update(ClassTeacherAssignment,
          { stream: { id: input.streamId }, active: true },
          { active: false, endDate: new Date() }
        );
      }
  
      // Deactivate any active assignments for this grade level (other teachers)
      if (input.gradeLevelId) {
        await manager.update(ClassTeacherAssignment,
          { gradeLevel: { id: input.gradeLevelId }, active: true },
          { active: false, endDate: new Date() }
        );
      }
  
      // Deactivate current teacher’s active assignment if different
      const existingTeacherAssignment = await manager.findOne(ClassTeacherAssignment, {
        where: { teacher: { id: input.teacherId }, active: true },
        relations: ['stream', 'gradeLevel'],
      });
  
      if (existingTeacherAssignment) {
        const isSame =
          existingTeacherAssignment.stream?.id === input.streamId &&
          existingTeacherAssignment.gradeLevel?.id === input.gradeLevelId;
  
        if (!isSame) {
          existingTeacherAssignment.active = false;
          existingTeacherAssignment.endDate = new Date();
          await manager.save(existingTeacherAssignment);
        } else {
          return existingTeacherAssignment; // same assignment, nothing to do
        }
      }
  
      // Create new assignment
      const assignment = manager.create(ClassTeacherAssignment, {
        tenant: { id: input.tenantId },
        teacher: { id: input.teacherId },
        stream: input.streamId ? { id: input.streamId } : undefined,
        gradeLevel: input.gradeLevelId ? { id: input.gradeLevelId } : undefined,
        active: true,
        startDate: new Date(),
      });
  
      try {
        const saved = await manager.save(assignment);
        return await manager.findOneOrFail(ClassTeacherAssignment, {
          where: { id: saved.id },
          relations: ['teacher', 'stream', 'gradeLevel'],
        });
      } catch (err: any) {
        // Catch unique constraint errors and return friendly message
        if (err.code === '23505') { // Postgres unique_violation
          throw new BadRequestException('Stream or grade level already has an active assignment');
        }
        throw err;
      }
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


