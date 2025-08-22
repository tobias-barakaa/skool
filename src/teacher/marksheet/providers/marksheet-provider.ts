import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Assessment } from '../assessment/entity/assessment.entity';
import { Repository } from 'typeorm';
import { Student } from 'src/admin/student/entities/student.entity';

@Injectable()
export class MarksheetProvider {
  constructor(
    @InjectRepository(Assessment)
    private assessmentRepository: Repository<Assessment>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Mark)
    private markRepository: Repository<Mark>,
  ) {}

  // Get all assessments for a specific tenant/grade/subject/term
  async getAssessmentsByContext(
    tenantGradeLevelId: string,
    tenantSubjectId: string,
    term: number,
  ): Promise<Assessment[]> {
    return this.assessmentRepository.find({
      where: {
        tenantGradeLevelId,
        tenantSubjectId,
        term,
      },
      order: {
        type: 'ASC', // CA first, then EXAM
        createdAt: 'ASC',
      },
    });
  }

  // Get all students for a grade level
  async getStudentsByGradeLevel(
    tenantGradeLevelId: string,
  ): Promise<Student[]> {
    return this.studentRepository.find({
      where: { tenantGradeLevelId },
      order: { name: 'ASC' },
    });
  }

  // Get marks for specific assessments and students
  async getMarksByAssessments(
    assessmentIds: string[],
    studentIds: string[],
  ): Promise<Mark[]> {
    if (assessmentIds.length === 0 || studentIds.length === 0) {
      return [];
    }

    return this.markRepository.find({
      where: {
        assessmentId: In(assessmentIds),
        studentId: In(studentIds),
      },
    });
  }

  // Create a new mark
  async createMark(input: CreateMarkInput): Promise<Mark> {
    // Check if mark already exists
    const existingMark = await this.markRepository.findOne({
      where: {
        studentId: input.studentId,
        assessmentId: input.assessmentId,
      },
    });

    if (existingMark) {
      throw new Error('Mark already exists for this student and assessment');
    }

    const mark = this.markRepository.create(input);
    return this.markRepository.save(mark);
  }

  // Update existing mark
  async updateMark(input: UpdateMarkInput): Promise<Mark> {
    const mark = await this.markRepository.findOne({
      where: { id: input.id },
    });

    if (!mark) {
      throw new Error('Mark not found');
    }

    mark.score = input.score;
    mark.updatedAt = new Date();

    return this.markRepository.save(mark);
  }

  // Delete mark
  async deleteMark(id: string): Promise<boolean> {
    const result = await this.markRepository.delete(id);
    return result.affected > 0;
  }

  // Get marks for a specific student across all assessments
  async getStudentMarks(
    studentId: string,
    tenantGradeLevelId: string,
    tenantSubjectId: string,
    term: number,
  ): Promise<Mark[]> {
    return this.markRepository
      .createQueryBuilder('mark')
      .leftJoin('mark.assessment', 'assessment')
      .where('mark.studentId = :studentId', { studentId })
      .andWhere('assessment.tenantGradeLevelId = :tenantGradeLevelId', {
        tenantGradeLevelId,
      })
      .andWhere('assessment.tenantSubjectId = :tenantSubjectId', {
        tenantSubjectId,
      })
      .andWhere('assessment.term = :term', { term })
      .getMany();
  }

  // Calculate statistics
  calculateStatistics(entries: MarksheetEntry[]): {
    meanScore: number;
    highestScore: number;
    lowestScore: number;
    totalStudents: number;
    studentsWithMarks: number;
  } {
    const studentsWithMarks = entries.filter((entry) => entry.finalScore > 0);
    const finalScores = studentsWithMarks.map((entry) => entry.finalScore);

    if (finalScores.length === 0) {
      return {
        meanScore: 0,
        highestScore: 0,
        lowestScore: 0,
        totalStudents: entries.length,
        studentsWithMarks: 0,
      };
    }

    return {
      meanScore: parseFloat(
        (
          finalScores.reduce((sum, score) => sum + score, 0) /
          finalScores.length
        ).toFixed(2),
      ),
      highestScore: Math.max(...finalScores),
      lowestScore: Math.min(...finalScores),
      totalStudents: entries.length,
      studentsWithMarks: finalScores.length,
    };
  }
}
