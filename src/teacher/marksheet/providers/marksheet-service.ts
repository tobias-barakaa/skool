import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Assessment } from '../assessment/entity/assessment.entity';
import { Repository } from 'typeorm';
import { Student } from 'src/admin/student/entities/student.entity';
import { MarkProvider } from './marksheet-provider';
import { MarksheetData } from '../interface/mark.interface';

@Injectable()
export class MarkService {
  constructor(private markProvider: MarkProvider) {}

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
}
