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
    input: AssignClassTeacherInput & { teacherId: string; tenantId: string },
  ): Promise<ClassTeacherAssignment> {
    // Validate teacher exists and belongs to tenant
    const teacher = await this.teacherRepo.findOne({
      where: { id: input.teacherId, tenantId: input.tenantId },
    });

    if (!teacher) {
      throw new BadRequestException(
        `Teacher with ID '${input.teacherId}' not found in tenant '${input.tenantId}'`
      );
    }

    // Validate stream if provided
    if (input.streamId) {
      const stream = await this.tenantStreamRepo.findOne({
        where: { id: input.streamId, tenant: { id: input.tenantId } },
      });

      if (!stream) {
        throw new BadRequestException(
          `Stream with ID '${input.streamId}' not found in tenant '${input.tenantId}'`
        );
      }

      // End any existing stream class teacher assignments for this stream
      await this.assignmentRepo.update(
        { stream: { id: input.streamId }, active: true },
        { active: false, endDate: new Date() },
      );
    }

    // Validate grade level if provided
    if (input.gradeLevelId) {
      const gradeLevel = await this.tenantGradeLevelRepo.findOne({
        where: { id: input.gradeLevelId, tenant: { id: input.tenantId } },
      });

      if (!gradeLevel) {
        throw new BadRequestException(
          `Grade level with ID '${input.gradeLevelId}' not found in tenant '${input.tenantId}'`
        );
      }

      // End any existing grade level class teacher assignments for this grade level
      await this.assignmentRepo.update(
        { gradeLevel: { id: input.gradeLevelId }, active: true },
        { active: false, endDate: new Date() },
      );
    }

    // End any existing assignments for this teacher
    await this.assignmentRepo.update(
      { teacher: { id: input.teacherId }, active: true },
      { active: false, endDate: new Date() },
    );

    // Create new assignment
    const assignment = this.assignmentRepo.create({
      tenant: { id: input.tenantId },
      teacher: { id: input.teacherId },
      stream: input.streamId ? { id: input.streamId } : undefined,
      gradeLevel: input.gradeLevelId ? { id: input.gradeLevelId } : undefined,
      active: true,
      startDate: new Date(),
    });

    return this.assignmentRepo.save(assignment);
  }

  async unassign(
    input: { teacherId: string; tenantId: string },
  ): Promise<void> {
    // Validate teacher exists and belongs to tenant
    const teacher = await this.teacherRepo.findOne({
      where: { id: input.teacherId, tenantId: input.tenantId },
    });

    if (!teacher) {
      throw new BadRequestException(
        `Teacher with ID '${input.teacherId}' not found in tenant '${input.tenantId}'`
      );
    }

    const result = await this.assignmentRepo.update(
      {
        teacher: { id: input.teacherId },
        tenant: { id: input.tenantId },
        active: true,
      },
      { active: false, endDate: new Date() },
    );

    if (result.affected === 0) {
      throw new BadRequestException(
        `No active class teacher assignment found for teacher '${input.teacherId}'`
      );
    }
  }
}
