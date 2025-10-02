import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { FeeItemSummary, GradeLevelStudentsSummary, StudentSummary } from '../dtos/student-summary.dto';
import { Student } from '../entities/student.entity';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';

@Injectable()
export class StudentSummaryService {
  private readonly logger = new Logger(StudentSummaryService.name);

  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    private readonly dataSource: DataSource,
  ) {}

  
  async getStudentSummary(
    studentId: string,
    user: ActiveUserData,
  ): Promise<StudentSummary> {
    const student = await this.studentRepository.findOne({
      where: {
        id: studentId,
        tenant_id: user.tenantId,
        isActive: true,
      },
      relations: [
        'user',
        'grade',
        'grade.gradeLevel',
        'grade.curriculum',
        'stream',
      ],
    });

    if (!student) {
      throw new NotFoundException(
        `Student with ID ${studentId} not found or not active`,
      );
    }

    const feeItems = await this.getStudentFeeItems(studentId, user.tenantId);

    return this.mapToStudentSummary(student, feeItems);
  }

 




  async getAllStudentsSummary(
    user: ActiveUserData,
  ): Promise<StudentSummary[]> {
    const students = await this.studentRepository.find({
      where: {
        tenant_id: user.tenantId,
        isActive: true,
      },
      relations: [
        'user',
        'grade',
        'grade.gradeLevel',
        'grade.curriculum',
        'stream',
      ],
      order: { createdAt: 'ASC' },
    });

    console.log(students, 'studkjf...............////////////////..............')

    const summaries = await Promise.all(
      students.map(async (student) => {
        const feeItems = await this.getStudentFeeItems(
          student.id,
          user.tenantId,
        );
        return this.mapToStudentSummary(student, feeItems);
      }),
    );

    return summaries;
  }

 
  async getStudentsSummaryByGradeLevel(
    user: ActiveUserData,
  ): Promise<GradeLevelStudentsSummary[]> {
    const students = await this.studentRepository.find({
      where: {
        tenant_id: user.tenantId,
        isActive: true,
      },
      relations: [
        'user',
        'grade',
        'grade.gradeLevel',
        'grade.curriculum',
        'stream',
      ],
      order: {
        grade: { gradeLevel: 'ASC' },
        createdAt: 'ASC',
      },
    });

    const groupedByGrade = new Map<string, Student[]>();
    students.forEach((student) => {
      const gradeId = student.grade.id;
      if (!groupedByGrade.has(gradeId)) {
        groupedByGrade.set(gradeId, []);
      }
      groupedByGrade.get(gradeId)!.push(student);
    });

    const gradeLevelSummaries: GradeLevelStudentsSummary[] = [];

    for (const [gradeId, gradeStudents] of groupedByGrade) {
      const firstStudent = gradeStudents[0];
      const studentSummaries = await Promise.all(
        gradeStudents.map(async (student) => {
          const feeItems = await this.getStudentFeeItems(
            student.id,
            user.tenantId,
          );
          return this.mapToStudentSummary(student, feeItems);
        }),
      );

      const totalFeesOwed = studentSummaries.reduce(
        (sum, s) => sum + s.feeSummary.totalOwed,
        0,
      );
      const totalFeesPaid = studentSummaries.reduce(
        (sum, s) => sum + s.feeSummary.totalPaid,
        0,
      );

      gradeLevelSummaries.push({
        gradeLevelId: gradeId,
        gradeLevelName: firstStudent.grade.gradeLevel.name,
        curriculumName: firstStudent.grade.curriculum.name,
        totalStudents: gradeStudents.length,
        totalFeesOwed,
        totalFeesPaid,
        totalBalance: totalFeesOwed - totalFeesPaid,
        students: studentSummaries,
      });
    }

    return gradeLevelSummaries;
  }

  async getStudentsSummaryBySpecificGradeLevel(
    gradeLevelId: string,
    user: ActiveUserData,
  ): Promise<GradeLevelStudentsSummary> {
    const students = await this.studentRepository.find({
      where: {
        tenant_id: user.tenantId,
        grade: { id: gradeLevelId },
        isActive: true,
      },
      relations: [
        'user',
        'grade',
        'grade.gradeLevel',
        'grade.curriculum',
        'stream',
      ],
      order: { createdAt: 'ASC' },
    });

    if (students.length === 0) {
      throw new NotFoundException(
        `No active students found for grade level ${gradeLevelId}`,
      );
    }

    const firstStudent = students[0];
    const studentSummaries = await Promise.all(
      students.map(async (student) => {
        const feeItems = await this.getStudentFeeItems(
          student.id,
          user.tenantId,
        );
        return this.mapToStudentSummary(student, feeItems);
      }),
    );

    const totalFeesOwed = studentSummaries.reduce(
      (sum, s) => sum + s.feeSummary.totalOwed,
      0,
    );
    const totalFeesPaid = studentSummaries.reduce(
      (sum, s) => sum + s.feeSummary.totalPaid,
      0,
    );

    return {
      gradeLevelId,
      gradeLevelName: firstStudent.grade.gradeLevel.name,
      curriculumName: firstStudent.grade.curriculum.name,
      totalStudents: students.length,
      totalFeesOwed,
      totalFeesPaid,
      totalBalance: totalFeesOwed - totalFeesPaid,
      students: studentSummaries,
    };
  }

 

  private async getStudentFeeItems(
    studentId: string,
    tenantId: string,
  ): Promise<any[]> {
    const query = `
     SELECT DISTINCT sfi.id, sfi.amount, sfi."isMandatory",
  fb.name as fee_bucket_name,
  fs.name as fee_structure_name,
  ay.name as academic_year_name
FROM student_fee_items sfi
JOIN student_fee_assignments sfa ON sfi."studentFeeAssignmentId" = sfa.id
JOIN fee_structure_items fsi ON sfi."feeStructureItemId" = fsi.id
JOIN fee_buckets fb ON fsi."feeBucketId" = fb.id
JOIN fee_assignments fa ON sfa."feeAssignmentId" = fa.id
JOIN fee_structures fs ON fa."feeStructureId" = fs.id
JOIN academic_years ay ON fs."academicYearId" = ay.id
WHERE sfa."studentId" = $1
  AND sfi."tenantId" = $2
  AND sfi."isActive" = true
  AND sfa."isActive" = true;
    `;

    return await this.dataSource.query(query, [studentId, tenantId]);
  }

 

  private mapToStudentSummary(
    student: Student,
    feeItems: any[],
  ): StudentSummary {
    const feeItemSummaries: FeeItemSummary[] = feeItems.map((item) => ({
      id: item.id,
      feeBucketName: item.fee_bucket_name,
      amount: parseFloat(item.amount),
      isMandatory: item.isMandatory,
      feeStructureName: item.fee_structure_name,
      academicYearName: item.academic_year_name,
      termName: item.term_name,
    }));

    const totalOwed = feeItemSummaries.reduce(
      (sum, item) => sum + item.amount,
      0,
    );

    return {
      id: student.id,
      admissionNumber: student.admission_number,
      studentName: student.user.name,
      email: student.user.email,
      phone: student.phone,
      gender: student.gender,
      schoolType: student.schoolType || 'day',
      gradeLevelName: student.grade.gradeLevel.name,
      curriculumName: student.grade.curriculum.name,
      streamName: student.stream?.name,
      feeSummary: {
        totalOwed,
        totalPaid: student.totalFeesPaid,
        balance: totalOwed - student.totalFeesPaid,
        numberOfFeeItems: feeItemSummaries.length,
        feeItems: feeItemSummaries,
      },
      isActive: student.isActive,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    };
  }
}


