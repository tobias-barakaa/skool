import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ClassTeacherAssignment } from "../entities/class_teacher_assignments.entity";
import { Repository } from "typeorm";
import { AssignClassTeacherInput, UnassignClassTeacherInput } from "../dtos/assign-class-teacher.dto";

@Injectable()
export class ClassTeacherProvider {
  constructor(
    @InjectRepository(ClassTeacherAssignment)
    private assignmentRepo: Repository<ClassTeacherAssignment>,
  ) {}

  async assign(
    input: AssignClassTeacherInput,
  ): Promise<ClassTeacherAssignment> {

    if (input.streamId) {
      await this.assignmentRepo.update(
        { stream: { id: input.streamId }, active: true },
        { active: false, endDate: new Date() },
      );
    }

    if (input.gradeLevelId) {
      await this.assignmentRepo.update(
        { gradeLevel: { id: input.gradeLevelId }, active: true },
        { active: false, endDate: new Date() },
      );
    }

    const assignment = this.assignmentRepo.create({
      tenant: { id: input.tenantId } as any,
      teacher: { id: input.teacherId } as any,
      stream: input.streamId ? ({ id: input.streamId } as any) : undefined,
      gradeLevel: input.gradeLevelId
        ? ({ id: input.gradeLevelId } as any)
        : undefined,
    });

    return this.assignmentRepo.save(assignment);
  }

  async unassign(input: UnassignClassTeacherInput): Promise<void> {
    await this.assignmentRepo.update(
      {
        teacher: { id: input.teacherId },
        tenant: { id: input.tenantId },
        active: true,
      },
      { active: false, endDate: new Date() },
    );
  }
}
