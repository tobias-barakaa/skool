import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Assessment } from '../assessment/entity/assessment.entity';
import { In, Repository } from 'typeorm';
import { Student } from 'src/admin/student/entities/student.entity';
import { Mark } from '../entities/marksheet-entity';

@Injectable()
export class MarkProvider {
  constructor(
    @InjectRepository(Mark)
    private markRepo: Repository<Mark>,

    @InjectRepository(Assessment)
    private assessmentRepo: Repository<Assessment>,

    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    
  ) {}

  async createMark(
    tenantId: string,
    studentId: string,
    assessmentId: string,
    score: number,
  ): Promise<Mark> {
    const existing = await this.markRepo.findOne({
      where: { tenantId, studentId, assessmentId },
    });

    if (existing) {
      existing.score = score;
      return this.markRepo.save(existing);
    }

    return this.markRepo.save({
      tenantId,
      studentId,
      assessmentId,
      score,
    });
  }

  async getMarksheet(
    tenantId: string,
    gradeId: string,
    subjectId: string,
    term: number,
  ) {
    // Get assessments ordered by type and creation
    const assessments = await this.assessmentRepo.find({
      where: { tenantGradeLevelId: gradeId, tenantSubjectId: subjectId, term },
      order: { type: 'ASC', createdAt: 'ASC' },
    });

    // Separate CAs and EXAMs
    const caAssessments = assessments.filter((a) => a.type === 'CA');
    const examAssessments = assessments.filter((a) => a.type === 'EXAM');

    // Get students
    const students = await this.studentRepo.find({
      where: { tenant_id: tenantId, grade: { id: gradeId } },
      order: { createdAt: 'ASC' },
    });

    // Get marks
    const marks = await this.markRepo.find({
      where: {
        tenantId,
        assessmentId: In(assessments.map((a) => a.id)),
      },
      order: { createdAt: 'ASC' },
    });

    // Build response
    const entries = students.map((student) => {
      const studentMarks = marks.filter((m) => m.studentId === student.id);
      const marksByAssessment = {};

      // Calculate CA total
      let caTotal = 0;
      caAssessments.forEach((assessment) => {
        const mark = studentMarks.find((m) => m.assessmentId === assessment.id);
        marksByAssessment[assessment.id] = mark?.score || null;
        caTotal += mark?.score || 0;
      });

      // Calculate EXAM total
      let examTotal = 0;
      examAssessments.forEach((assessment) => {
        const mark = studentMarks.find((m) => m.assessmentId === assessment.id);
        marksByAssessment[assessment.id] = mark?.score || null;
        examTotal += mark?.score || 0;
      });

      // Final total (CA + EXAM)
      const finalTotal = caTotal + examTotal;

      return {
        student,
        marks: marksByAssessment,
        caTotal,
        examTotal,
        finalTotal,
      };
    });

    // Calculate stats based on final total
    const finalScores = entries.map((e) => e.finalTotal).filter((t) => t > 0);
    const stats = {
      mean: finalScores.length
        ? parseFloat(
            (
              finalScores.reduce((a, b) => a + b, 0) / finalScores.length
            ).toFixed(2),
          )
        : 0,
      highest: finalScores.length ? Math.max(...finalScores) : 0,
      lowest: finalScores.length ? Math.min(...finalScores) : 0,
      entered: finalScores.length,
      total: students.length,
    };

    return {
      assessments: {
        cas: caAssessments,
        exams: examAssessments,
      },
      entries,
      stats,
    };
  }
}
