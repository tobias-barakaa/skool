import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Assessment } from '../assessment/entity/assessment.entity';
import { Repository } from 'typeorm';
import { Student } from 'src/admin/student/entities/student.entity';
import { MarkProvider } from './marksheet-provider';
import { MarksheetData } from '../interface/mark.interface';
import {  EnterStudentMarksInput } from '../dtos/enter-mark.input';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { AssessmentMark } from '../entities/assessment_marks-entity';
import { Mark } from '../entities/marksheet-entity';

@Injectable()
export class MarkService {
  constructor(
    private markProvider: MarkProvider,
    @InjectRepository(AssessmentMark)
    private markRepo: Repository<AssessmentMark>,
    @InjectRepository(Assessment)
    private assessmentRepo: Repository<Assessment>,
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
  ) {}

  async addMarks(
    tenantId: string,
    marks: Array<{ studentId: string; assessmentId: string; score: number }>,
  ) {
    const results = await Promise.all(
      marks.map((mark) =>
        this.markProvider.createMark(
          tenantId,
          mark.studentId,
          mark.assessmentId,
          mark.score,
        ),
      ),
    );
    return results;
  }

  async getMarksheet(
    tenantId: string,
    gradeId: string,
    subjectId: string,
    term: number,
  ) {
    return this.markProvider.getMarksheet(tenantId, gradeId, subjectId, term);
  }

  async enterStudentMarks(
    input: EnterStudentMarksInput,
    user: ActiveUserData,
  ): Promise<AssessmentMark[]> {
    const { studentId, marks } = input;

    // ---------- 1. Validate student belongs to tenant ----------
    const student = await this.studentRepo.findOne({
      where: { id: studentId, tenant_id: user.tenantId },
    });

    if (!student) {
      throw new NotFoundException('Student not found in your tenant');
    }

    const results: AssessmentMark[] = [];

    // ---------- 2. Process every mark ----------
    for (const m of marks) {
      // 2a. Validate assessment exists and belongs to tenant
      const assessment = await this.assessmentRepo.findOne({
        where: { id: m.assessmentId, tenantId: user.tenantId },
      });

      if (!assessment) {
        throw new NotFoundException(`Assessment ${m.assessmentId} not found`);
      }

      // 2b. Validate score is within bounds
      if (!assessment.maxScore || m.score < 0 || m.score > assessment.maxScore) {
        throw new BadRequestException(
          `Score ${m.score} is invalid. Must be between 0 and ${assessment.maxScore ?? 'unknown'}`,
        );
      }

      // 2c. Locate existing mark or create a new one
      let mark = await this.markRepo.findOne({
        where: {
          assessmentId: m.assessmentId,
          studentId,
          // Add tenant validation for extra security
          assessment: { tenantId: user.tenantId },
        },
        relations: ['assessment'],
      });

      if (mark) {
        // Update existing mark
        mark.score = m.score;
      } else {
        // Create new mark
        mark = this.markRepo.create({
          assessmentId: m.assessmentId,
          studentId,
          score: m.score,
        });
      }

      // 2d. Save & reload with all relations
      const savedMark = await this.markRepo.save(mark);

      // Load the complete mark with all relations
      const loadedMark = await this.markRepo.findOne({
        where: { id: savedMark.id },
        relations: [
          'student',
          'student.user',
          'assessment',
          'assessment.tenantGradeLevel',
          'assessment.tenantSubject',
        ],
      });

      if (loadedMark) {
        results.push(loadedMark);
      }
    }

    return results;
  }
}
