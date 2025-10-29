import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssessmentMark } from 'src/teacher/marksheet/entities/assessment_marks-entity';
import { Student } from 'src/admin/student/entities/student.entity';
import { Assessment } from 'src/teacher/marksheet/assessment/entity/assessment.entity';
import { GetStudentMarksFilterDto, StudentMarkDetail, StudentRanking, StudentReportCard, SubjectPerformance, TermPerformance } from '../dtos/get-student-marks.dto';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';

@Injectable()
export class StudentMarksheetService {
  private readonly logger = new Logger(StudentMarksheetService.name);

  constructor(
    @InjectRepository(AssessmentMark)
    private readonly markRepository: Repository<AssessmentMark>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Assessment)
    private readonly assessmentRepository: Repository<Assessment>,
  ) {}

  async getStudentMarks(
    studentId: string,
    filter: GetStudentMarksFilterDto,
    currentUser: ActiveUserData,
  ): Promise<StudentMarkDetail[]> {
    this.logger.log(`Fetching marks for student ${studentId}`);

    // Verify student access
    await this.verifyStudentAccess(studentId, currentUser);

    const queryBuilder = this.markRepository
      .createQueryBuilder('mark')
      .leftJoinAndSelect('mark.assessment', 'assessment')
      .leftJoinAndSelect('assessment.tenantSubject', 'tenantSubject')
      .leftJoinAndSelect('tenantSubject.subject', 'subject')
      .leftJoinAndSelect('tenantSubject.customSubject', 'customSubject')
      .leftJoinAndSelect('assessment.tenantGradeLevel', 'tenantGradeLevel')
      .leftJoinAndSelect('tenantGradeLevel.gradeLevel', 'gradeLevel')
      .where('mark.studentId = :studentId', { studentId })
      .andWhere('assessment.tenantId = :tenantId', { tenantId: currentUser.tenantId });

    if (filter.academicYear) {
      queryBuilder.andWhere('assessment.academicYear = :academicYear', {
        academicYear: filter.academicYear,
      });
    }

    if (filter.term) {
      queryBuilder.andWhere('assessment.term = :term', { term: filter.term });
    }

    if (filter.tenantSubjectId) {
      queryBuilder.andWhere('assessment.tenantSubjectId = :tenantSubjectId', {
        tenantSubjectId: filter.tenantSubjectId,
      });
    }

    if (filter.assessmentType) {
      queryBuilder.andWhere('assessment.type = :type', { type: filter.assessmentType });
    }

    queryBuilder.orderBy('assessment.createdAt', 'DESC');

    const marks = await queryBuilder.getMany();

    return marks.map((mark) => this.mapToStudentMarkDetail(mark));
  }

  async getStudentReportCard(
    studentId: string,
    academicYear: string,
    currentUser: ActiveUserData,
  ): Promise<StudentReportCard> {
    this.logger.log(`Generating report card for student ${studentId}`);

    const student = await this.verifyStudentAccess(studentId, currentUser);

    const marks = await this.markRepository
      .createQueryBuilder('mark')
      .leftJoinAndSelect('mark.assessment', 'assessment')
      .leftJoinAndSelect('assessment.tenantSubject', 'tenantSubject')
      .leftJoinAndSelect('tenantSubject.subject', 'subject')
      .leftJoinAndSelect('tenantSubject.customSubject', 'customSubject')
      .leftJoinAndSelect('assessment.tenantGradeLevel', 'tenantGradeLevel')
      .leftJoinAndSelect('tenantGradeLevel.gradeLevel', 'gradeLevel')
      .where('mark.studentId = :studentId', { studentId })
      .andWhere('assessment.academicYear = :academicYear', { academicYear })
      .andWhere('assessment.tenantId = :tenantId', { tenantId: currentUser.tenantId })
      .getMany();

    if (marks.length === 0) {
      throw new NotFoundException('No marks found for the specified academic year');
    }

    const termPerformances = this.calculateTermPerformances(marks);
    const allSubjects = this.calculateSubjectPerformances(marks);
    const overallStats = this.calculateOverallStats(marks);

    return {
      studentId: student.id,
      studentName: student.user.name,
      admissionNumber: student.admission_number,
      gradeLevel: student.grade.gradeLevel.name,
      overallAverage: overallStats.average,
      overallGrade: this.calculateGrade(overallStats.average),
      totalAssessments: marks.length,
      termPerformances,
      allSubjects,
    };
  }

  async getSubjectPerformance(
    studentId: string,
    subjectId: string,
    academicYear: string,
    currentUser: ActiveUserData,
  ): Promise<SubjectPerformance> {
    this.logger.log(
      `Fetching subject performance for student ${studentId}, subject ${subjectId}`,
    );
  
    // ✅ Verify student access
    await this.verifyStudentAccess(studentId, currentUser);
  
    // ✅ Properly join all required relations
    const marks = await this.markRepository
      .createQueryBuilder('mark')
      .leftJoinAndSelect('mark.assessment', 'assessment')
      .leftJoinAndSelect('assessment.tenantSubject', 'tenantSubject')
      .leftJoinAndSelect('tenantSubject.subject', 'subject')
      .leftJoinAndSelect('tenantSubject.customSubject', 'customSubject')
      .leftJoinAndSelect('mark.student', 'student')
      .leftJoinAndSelect('student.grade', 'tenantGradeLevel')
      .leftJoinAndSelect('tenantGradeLevel.gradeLevel', 'gradeLevel')
      // ✅ Added missing joins for assessment’s grade level
      .leftJoinAndSelect('assessment.tenantGradeLevel', 'assessmentGradeLevel')
      .leftJoinAndSelect('assessmentGradeLevel.gradeLevel', 'assessmentGrade')
      .where('mark.studentId = :studentId', { studentId })
      .andWhere('assessment.tenantSubjectId = :subjectId', { subjectId })
      .andWhere('assessment.academicYear = :academicYear', { academicYear })
      .andWhere('assessment.tenantId = :tenantId', {
        tenantId: currentUser.tenantId,
      })
      .getMany();
  
    if (!marks.length) {
      throw new NotFoundException('No marks found for this subject');
    }
  
    // ✅ Calculate and return performance
    return this.calculateSubjectPerformance(marks);
  }
  
  private calculateSubjectPerformance(marks: AssessmentMark[]): SubjectPerformance {
    const assessment = marks[0].assessment;
    const subjectName =
      assessment.tenantSubject.subject?.name ||
      assessment.tenantSubject.customSubject?.name ||
      'Unknown Subject';
  
    const totalScore = marks.reduce((sum, m) => sum + m.score, 0);
    const maxPossibleScore = marks.reduce(
      (sum, m) => sum + (m.assessment?.maxScore ?? 0),
      0,
    );
    const percentage =
      maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
    const average = marks.length > 0 ? totalScore / marks.length : 0;
  
    return {
      subjectId: assessment.tenantSubjectId,
      subjectName,
      totalScore,
      maxPossibleScore,
      percentage,
      average,
      assessmentsCount: marks.length,
      grade: this.calculateGrade(percentage),
      marks: marks.map((m) => this.mapToStudentMarkDetail(m)),
    };
  }
  
  private mapToStudentMarkDetail(mark: AssessmentMark): StudentMarkDetail {
    const assessment = mark.assessment;
    const subjectName =
      assessment.tenantSubject.subject?.name ||
      assessment.tenantSubject.customSubject?.name ||
      'Unknown Subject';
  
    const maxScore = assessment.maxScore ?? 0;
    const percentage = maxScore > 0 ? (mark.score / maxScore) * 100 : 0;
  
    const isPassed =
      assessment.cutoff !== undefined && assessment.cutoff !== null
        ? mark.score >= assessment.cutoff
        : percentage >= 50;
  
    // ✅ Safe access with fallbacks
    const gradeLevelName =
      assessment.tenantGradeLevel?.gradeLevel?.name ?? 'Unknown Grade';
  
    // Log any missing grade level for debugging
    if (gradeLevelName === 'Unknown Grade') {
      this.logger.warn(
        `⚠️ Missing gradeLevel for assessment ${assessment.id} in mark ${mark.id}`,
      );
    }
  
    return {
      id: mark.id,
      score: mark.score,
      maxScore: maxScore,
      percentage,
      title: assessment.title,
      type: assessment.type,
      subject: subjectName,
      gradeLevel: gradeLevelName,
      cutoff: assessment.cutoff,
      status: assessment.status,
      term: assessment.term,
      academicYear: assessment.academicYear,
      date: assessment.date,
      isPassed,
      createdAt: mark.createdAt,
    };
  }
  
  

 
  
  
  
  private determineGrade(average: number): string {
    if (average >= 80) return 'A';
    if (average >= 70) return 'B';
    if (average >= 60) return 'C';
    if (average >= 50) return 'D';
    if (average >= 40) return 'E';
    return 'F';
  }
  

  async getStudentRanking(
    studentId: string,
    academicYear: string,
    term: number,
    currentUser: ActiveUserData,
  ): Promise<StudentRanking> {
    this.logger.log(`Calculating ranking for student ${studentId}`);

    const student = await this.verifyStudentAccess(studentId, currentUser);

    const studentsInGrade = await this.studentRepository.find({
      where: {
        grade: { id: student.grade.id },
        tenant_id: currentUser.tenantId,
        isActive: true,
      },
    });

    const studentIds = studentsInGrade.map((s) => s.id);

    const averages = await Promise.all(
      studentIds.map(async (id) => {
        const marks = await this.markRepository
          .createQueryBuilder('mark')
          .leftJoinAndSelect('mark.assessment', 'assessment')
          .where('mark.studentId = :id', { id })
          .andWhere('assessment.academicYear = :academicYear', { academicYear })
          .andWhere('assessment.term = :term', { term })
          .andWhere('assessment.tenantId = :tenantId', { tenantId: currentUser.tenantId })
          .getMany();

        const stats = this.calculateOverallStats(marks);
        return { studentId: id, average: stats.average };
      }),
    );

    averages.sort((a, b) => b.average - a.average);

    const studentRankIndex = averages.findIndex((a) => a.studentId === studentId);
    const studentAverage = averages[studentRankIndex]?.average || 0;
    const classAverage = averages.reduce((sum, a) => sum + a.average, 0) / averages.length;
    const topScore = averages[0]?.average || 0;
    const percentile = ((averages.length - studentRankIndex) / averages.length * 100).toFixed(2);

    return {
      rank: studentRankIndex + 1,
      totalStudents: averages.length,
      studentAverage,
      classAverage,
      topScore,
      percentile: `${percentile}%`,
    };
  }

  // Helper methods
  private async verifyStudentAccess(
    studentId: string,
    currentUser: ActiveUserData,
  ): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: ['user', 'grade', 'grade.gradeLevel'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (student.tenant_id !== currentUser.tenantId) {
      throw new ForbiddenException('Access denied to this student');
    }

    if ((currentUser as any).role === 'STUDENT' && student.user_id !== currentUser.sub) {
      throw new ForbiddenException('You can only access your own marks');
    }

    return student;
  }

  // private mapToStudentMarkDetail(mark: AssessmentMark): StudentMarkDetail {
  //   const assessment = mark.assessment;
  //   const subjectName = assessment.tenantSubject.subject?.name || 
  //                      assessment.tenantSubject.customSubject?.name || 
  //                      'Unknown Subject';
    
  //   const maxScore = assessment.maxScore ?? 0;
  //   const percentage = maxScore > 0 ? (mark.score / maxScore) * 100 : 0;
  //   const isPassed = (assessment.cutoff !== undefined && assessment.cutoff !== null)
  //     ? mark.score >= assessment.cutoff
  //     : percentage >= 50;

  //   return {
  //     id: mark.id,
  //     score: mark.score,
  //     maxScore: maxScore,
  //     percentage,
  //     title: assessment.title,
  //     type: assessment.type,
  //     subject: subjectName,
  //     gradeLevel: assessment.tenantGradeLevel.gradeLevel.name,
  //     cutoff: assessment.cutoff,
  //     status: assessment.status,
  //     term: assessment.term,
  //     academicYear: assessment.academicYear,
  //     date: assessment.date,
  //     isPassed,
  //     createdAt: mark.createdAt,
  //   };
  // }

  private calculateTermPerformances(marks: AssessmentMark[]): TermPerformance[] {
    const termMap = new Map<string, AssessmentMark[]>();

    marks.forEach((mark) => {
      const key = `${mark.assessment.term}-${mark.assessment.academicYear}`;
      let termMarks = termMap.get(key);
      if (!termMarks) {
        termMarks = [];
        termMap.set(key, termMarks);
      }
      termMarks.push(mark);
    });

    return Array.from(termMap.entries()).map(([key, termMarks]) => {
      const [term, academicYear] = key.split('-');
      const stats = this.calculateOverallStats(termMarks);
      const subjects = this.calculateSubjectPerformances(termMarks);

      return {
        term: parseInt(term),
        academicYear,
        totalScore: stats.totalScore,
        maxPossibleScore: stats.maxPossibleScore,
        percentage: stats.percentage,
        average: stats.average,
        grade: this.calculateGrade(stats.average),
        totalAssessments: termMarks.length,
        passedAssessments: stats.passedCount,
        failedAssessments: stats.failedCount,
        subjects,
      };
    });
  }

  private calculateSubjectPerformances(marks: AssessmentMark[]): SubjectPerformance[] {
    const subjectMap = new Map<string, AssessmentMark[]>();

    marks.forEach((mark) => {
      const subjectId = mark.assessment.tenantSubjectId;
      const list = subjectMap.get(subjectId);
      if (list) {
        list.push(mark);
      } else {
        subjectMap.set(subjectId, [mark]);
      }
    });

    return Array.from(subjectMap.entries()).map(([subjectId, subjectMarks]) => 
      this.calculateSubjectPerformance(subjectMarks)
    );
  }

  // private calculateSubjectPerformance(marks: AssessmentMark[]): SubjectPerformance {
  //   const assessment = marks[0].assessment;
  //   const subjectName = assessment.tenantSubject.subject?.name || 
  //                      assessment.tenantSubject.customSubject?.name || 
  //                      'Unknown Subject';

  //   const totalScore = marks.reduce((sum, m) => sum + m.score, 0);
  //   const maxPossibleScore = marks.reduce((sum, m) => sum + (m.assessment?.maxScore ?? 0), 0);
  //   const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
  //   const average = marks.length > 0 ? totalScore / marks.length : 0;

  //   return {
  //     subjectId: assessment.tenantSubjectId,
  //     subjectName,
  //     totalScore,
  //     maxPossibleScore,
  //     percentage,
  //     average,
  //     assessmentsCount: marks.length,
  //     grade: this.calculateGrade(percentage),
  //     marks: marks.map((m) => this.mapToStudentMarkDetail(m)),
  //   };
  // }
  



  private calculateOverallStats(marks: AssessmentMark[]) {
    const totalScore = marks.reduce((sum, m) => sum + m.score, 0);
    const maxPossibleScore = marks.reduce((sum, m) => sum + (m.assessment?.maxScore ?? 0), 0);
    const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
    const average = marks.length > 0 ? totalScore / marks.length : 0;

    const passedCount = marks.filter((m) => {
      const cutoff = m.assessment?.cutoff;
      const maxScore = m.assessment?.maxScore ?? 0;
      if (cutoff !== undefined && cutoff !== null) {
        return m.score >= cutoff;
      }
      if (maxScore > 0) {
        return (m.score / maxScore) * 100 >= 50;
      }
      return false;
    }).length;

    const failedCount = marks.length - passedCount;

    return { totalScore, maxPossibleScore, percentage, average, passedCount, failedCount };
  }

  private calculateGrade(percentage: number): string {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  }
}



