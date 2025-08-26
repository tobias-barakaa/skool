import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Assessment } from '../assessment/entity/assessment.entity';
import { In, Repository } from 'typeorm';
import { Student } from 'src/admin/student/entities/student.entity';
import {  EnterStudentMarksInput } from '../dtos/enter-mark.input';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { AssessmentMark } from '../entities/assessment_marks-entity';
import { AssessType } from '../assessment/enums/assesment-type.enum';
import { SchoolSetupGuardService } from 'src/admin/config/school-config.guard';


@Injectable()
export class MarkService {
  constructor(
    @InjectRepository(AssessmentMark)
    private markRepo: Repository<AssessmentMark>,
    @InjectRepository(Assessment)
    private assessmentRepo: Repository<Assessment>,
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    private readonly schoolSetupGuardService: SchoolSetupGuardService,
  ) {}

  async enterStudentMarks(
    input: EnterStudentMarksInput,
    user: ActiveUserData,
  ): Promise<AssessmentMark[]> {
    await this.ensureSchoolConfigured(user.tenantId);

    const { studentId, marks } = input;

    const student = await this.studentRepo.findOne({
      where: { id: studentId, tenant_id: user.tenantId },
    });

    if (!student) {
      throw new NotFoundException('Student not found in your tenant');
    }

    const results: AssessmentMark[] = [];

    for (const m of marks) {
      const assessment = await this.assessmentRepo.findOne({
        where: { id: m.assessmentId, tenantId: user.tenantId },
      });

      if (!assessment) {
        throw new NotFoundException(`Assessment ${m.assessmentId} not found`);
      }

      if (
        !assessment.maxScore ||
        m.score < 0 ||
        m.score > assessment.maxScore
      ) {
        throw new BadRequestException(
          `Score ${m.score} is invalid. Must be between 0 and ${assessment.maxScore ?? 'unknown'}`,
        );
      }

      let mark = await this.markRepo.findOne({
        where: {
          assessmentId: m.assessmentId,
          studentId,
          assessment: { tenantId: user.tenantId },
        },
        relations: ['assessment'],
      });

      if (mark) {
        mark.score = m.score;
      } else {
        mark = this.markRepo.create({
          assessmentId: m.assessmentId,
          studentId,
          score: m.score,
        });
      }

      const savedMark = await this.markRepo.save(mark);

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

  async getTermAssessmentsWithStudents(
  term: number,
  tenantGradeLevelId: string,
 academicYear: string,
  tenantId: string,
) {
  await this.ensureSchoolConfigured(tenantId);

  const assessments = await this.assessmentRepo.find({
    where: {
      term,
      tenantGradeLevelId,
     academicYear,
      tenantId,
      type: In([AssessType.CA, AssessType.EXAM]),
    },
    order: { createdAt: 'ASC' },
  });

  /* students query unchanged */
  const students = await this.studentRepo.find({
    where: {
      grade: { id: tenantGradeLevelId },
      tenant_id: tenantId,
      isActive: true,
    },
    relations: ['user'],
    order: { user: { name: 'ASC' } },
  });

  return { assessments, students };
}

  async updateStudentMarks(
    input: EnterStudentMarksInput,
    user: ActiveUserData,
  ): Promise<AssessmentMark[]> {
    await this.ensureSchoolConfigured(user.tenantId);

    const { studentId, marks } = input;

    const student = await this.studentRepo.findOne({
      where: { id: studentId, tenant_id: user.tenantId },
    });
    if (!student) throw new NotFoundException('Student not found');

    const results: AssessmentMark[] = [];

    for (const m of marks) {
      const mark = await this.markRepo.findOne({
        where: {
          assessmentId: m.assessmentId,
          studentId,
          assessment: { tenantId: user.tenantId },
        },
        relations: ['assessment'],
      });
      if (!mark) throw new NotFoundException(`Mark not found`);

      if (
        !mark.assessment.maxScore ||
        m.score < 0 ||
        m.score > mark.assessment.maxScore
      ) {
        throw new BadRequestException(
          `Score ${m.score} invalid. Must be 0-${mark.assessment.maxScore}`,
        );
      }

      mark.score = m.score;
      const saved = await this.markRepo.save(mark);

      const loaded = await this.markRepo.findOne({
        where: { id: saved.id },
        relations: [
          'student',
          'student.user',
          'assessment',
          'assessment.tenantGradeLevel',
          'assessment.tenantSubject',
        ],
      });
      if (loaded) results.push(loaded);
    }
    return results;
  }

  private async ensureSchoolConfigured(tenantId: string): Promise<void> {
    await this.schoolSetupGuardService.validateSchoolIsConfigured(tenantId);
  }

  async marksStats(
  term: number,
  tenantGradeLevelId: string,
  tenantSubjectId: string,
  academicYear: string,
  tenantId: string,
) {
  await this.ensureSchoolConfigured(tenantId);

  const qb = this.markRepo
    .createQueryBuilder('mark')
    .innerJoin('mark.assessment', 'assessment')
    .where('assessment.term = :term', { term })
    .andWhere('assessment.academicYear = :academicYear', { academicYear })
    .andWhere('assessment.tenantGradeLevelId = :tenantGradeLevelId', {
      tenantGradeLevelId,
    })
    .andWhere('assessment.tenantSubjectId = :tenantSubjectId', {
      tenantSubjectId,
    })
    .andWhere('assessment.tenantId = :tenantId', { tenantId });

  const [stats, totalStudents] = await Promise.all([
    qb
      .select('AVG(mark.score)', 'mean')
      .addSelect('MAX(mark.score)', 'highest')
      .addSelect('MIN(mark.score)', 'lowest')
      .addSelect('COUNT(mark.id)', 'entered')
      .getRawOne(),
    this.studentRepo.count({
      where: {
        grade: { id: tenantGradeLevelId },
        tenant_id: tenantId,
        isActive: true,
      },
    }),
  ]);

  return {
    mean: Number(stats.mean ?? 0).toFixed(2),
    highest: Number(stats.highest ?? 0),
    lowest: Number(stats.lowest ?? 0),
    entered: Number(stats.entered),
    total: totalStudents,
  };
}
}
