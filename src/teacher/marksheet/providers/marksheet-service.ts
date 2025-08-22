import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Assessment } from '../assessment/entity/assessment.entity';
import { Repository } from 'typeorm';
import { Student } from 'src/admin/student/entities/student.entity';
import { MarksheetProvider } from './marksheet-provider';
import { MarksheetData } from '../interface/mark.interface';

@Injectable()
export class MarksheetService {
  constructor(private marksheetProvider: MarksheetProvider) {}

  async getMarksheet(
    tenantGradeLevelId: string,
    tenantSubjectId: string,
    term: number,
  ): Promise<MarksheetData> {
    // Get all assessments for this context
    const assessments = await this.marksheetProvider.getAssessmentsByContext(
      tenantGradeLevelId,
      tenantSubjectId,
      term,
    );

    // Get all students for this grade level
    const students =
      await this.marksheetProvider.getStudentsByGradeLevel(tenantGradeLevelId);

    if (students.length === 0) {
      return {
        assessments,
        entries: [],
        statistics: {
          meanScore: 0,
          highestScore: 0,
          lowestScore: 0,
          totalStudents: 0,
          studentsWithMarks: 0,
        },
      };
    }

    // Get all marks for these assessments and students
    const assessmentIds = assessments.map((a) => a.id);
    const studentIds = students.map((s) => s.id);

    const marks = await this.marksheetProvider.getMarksByAssessments(
      assessmentIds,
      studentIds,
    );

    // Organize marks by student and assessment
    const marksByStudent = marks.reduce(
      (acc, mark) => {
        if (!acc[mark.studentId]) {
          acc[mark.studentId] = {};
        }
        acc[mark.studentId][mark.assessmentId] = mark.score;
        return acc;
      },
      {} as { [studentId: string]: { [assessmentId: string]: number } },
    );

    // Calculate total possible score
    const totalMaxScore = assessments.reduce(
      (sum, assessment) => sum + assessment.maxScore,
      0,
    );

    // Create marksheet entries
    const entries: MarksheetEntry[] = students.map((student) => {
      const studentMarks = marksByStudent[student.id] || {};

      // Calculate final score
      const finalScore = assessmentIds.reduce((sum, assessmentId) => {
        const score = studentMarks[assessmentId];
        return sum + (score || 0);
      }, 0);

      return {
        student,
        marks: assessmentIds.reduce(
          (acc, assessmentId) => {
            acc[assessmentId] = studentMarks[assessmentId] || null;
            return acc;
          },
          {} as { [assessmentId: string]: number | null },
        ),
        finalScore,
      };
    });

    // Calculate statistics
    const statistics = this.marksheetProvider.calculateStatistics(entries);

    return {
      assessments,
      entries,
      statistics,
    };
  }

  async createMark(input: CreateMarkInput): Promise<Mark> {
    return this.marksheetProvider.createMark(input);
  }

  async updateMark(input: UpdateMarkInput): Promise<Mark> {
    return this.marksheetProvider.updateMark(input);
  }

  async deleteMark(id: string): Promise<boolean> {
    return this.marksheetProvider.deleteMark(id);
  }

  async getStudentReport(
    studentId: string,
    tenantGradeLevelId: string,
    tenantSubjectId: string,
    term: number,
  ): Promise<{
    student: Student;
    assessments: Assessment[];
    marks: Mark[];
    totalScore: number;
    totalPossible: number;
    percentage: number;
  }> {
    const [student, assessments, marks] = await Promise.all([
      this.marksheetProvider.studentRepository.findOne({
        where: { id: studentId },
      }),
      this.marksheetProvider.getAssessmentsByContext(
        tenantGradeLevelId,
        tenantSubjectId,
        term,
      ),
      this.marksheetProvider.getStudentMarks(
        studentId,
        tenantGradeLevelId,
        tenantSubjectId,
        term,
      ),
    ]);

    if (!student) {
      throw new Error('Student not found');
    }

    const totalScore = marks.reduce((sum, mark) => sum + mark.score, 0);
    const totalPossible = assessments.reduce(
      (sum, assessment) => sum + assessment.maxScore,
      0,
    );
    const percentage =
      totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0;

    return {
      student,
      assessments,
      marks,
      totalScore,
      totalPossible,
      percentage: parseFloat(percentage.toFixed(2)),
    };
  }
}
