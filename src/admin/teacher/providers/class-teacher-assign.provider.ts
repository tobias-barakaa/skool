import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ClassTeacherAssignment } from "../entities/class_teacher_assignments.entity";
import { Repository } from "typeorm";
import { TenantStream } from "src/admin/school-type/entities/tenant-stream";
import { TenantGradeLevel } from "src/admin/school-type/entities/tenant-grade-level";
import { Teacher } from "../entities/teacher.entity";
import { AssignClassTeacherInput, UnassignClassTeacherInput } from "../dtos/assign/assign-classTeacher.dto";

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
    // ... validation code ...
  
    // Remove any existing stream class teacher assignments for this stream
    if (input.streamId) {
      await this.assignmentRepo.delete({
        stream: { id: input.streamId },
        active: true,
      });
    }
  
    // Remove any existing grade level class teacher assignments for this grade level
    if (input.gradeLevelId) {
      await this.assignmentRepo.delete({
        gradeLevel: { id: input.gradeLevelId },
        active: true,
      });
    }
  
    // Remove any existing assignments for this teacher
    await this.assignmentRepo.delete({
      teacher: { id: input.teacherId },
      active: true,
    });
  
    // Create new assignment
    const assignment = this.assignmentRepo.create({
      tenant: { id: input.tenantId },
      teacher: { id: input.teacherId },
      stream: input.streamId ? { id: input.streamId } : undefined,
      gradeLevel: input.gradeLevelId ? { id: input.gradeLevelId } : undefined,
      active: true,
      startDate: new Date(),
    });
  
    const saved = await this.assignmentRepo.save(assignment);
    
    const found = await this.assignmentRepo.findOne({
      where: { id: saved.id },
      relations: ['teacher', 'stream', 'gradeLevel'],
    });

    if (!found) {
      throw new BadRequestException(
        `Could not find the newly created class teacher assignment with ID '${saved.id}'`
      );
    }

    return found;
  }


  async unassign(input: { teacherId: string; tenantId: string }): Promise<void> {
    return await this.assignmentRepo.manager.transaction(async (transactionalEntityManager) => {
      // ... validation code ...
      
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
  
      // First, delete any existing inactive records for this teacher-tenant combo
      await transactionalEntityManager.delete(ClassTeacherAssignment, {
        teacher: { id: input.teacherId },
        tenant: { id: input.tenantId },
        active: false,
      });
  
      // Then update the current assignment
      assignment.active = false;
      assignment.endDate = new Date();
      await transactionalEntityManager.save(assignment);
    });
  }

}



