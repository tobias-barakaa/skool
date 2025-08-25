import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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

    // Validate student in tenant
    const student = await this.studentRepo.findOne({
      where: { id: studentId, tenant_id: user.tenantId },
    });
    if (!student)
      throw new NotFoundException('Student not found in your tenant');

    const results: AssessmentMark[] = [];

    for (const m of marks) {
      const assessment = await this.assessmentRepo.findOne({
        where: { id: m.assessmentId },
      });
      if (!assessment)
        throw new NotFoundException(`Assessment ${m.assessmentId} not found`);
      if (assessment.tenantId !== user.tenantId)
        throw new ForbiddenException('Assessment not in your tenant');

      let mark = await this.markRepo.findOne({
        where: { assessmentId: m.assessmentId, studentId },
      });

      if (!mark) {
        mark = this.markRepo.create({
          assessmentId: m.assessmentId,
          studentId,
          score: m.score,
        });
      } else {
        mark.score = m.score;
      }

      results.push(await this.markRepo.save(mark));
    }

    return results;
  }
}
