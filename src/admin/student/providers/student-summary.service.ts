import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { FeeItemSummary, GradeLevelStudentsSummary, StudentSummary } from '../dtos/student-summary.dto';
import { Student } from '../entities/student.entity';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { InvoiceStatus } from 'src/admin/finance/invoice/entities/invoice.entity';
import { AcademicYearFinancialSummary } from '../dtos/school-financial-summary.dto';


// interface StudentSummary {
//   id: string;
//   admissionNumber: string;
//   password: string; // This is the admission number
//   studentName: string;
//   email: string;
//   phone: string;
//   gender: string;
//   schoolType: string;
//   gradeLevelName: string;
//   curriculumName: string;
//   streamName?: string;
//   feeSummary: {
//     totalOwed: number;
//     totalPaid: number;
//     balance: number;
//     numberOfFeeItems: number;
//     feeItems: FeeItemSummary[];
//   };
//   isActive: boolean;
//   createdAt: Date;
//   updatedAt: Date;
// }

// interface GradeLevelStudentsSummary {
//   gradeLevelId: string;
//   gradeLevelName: string;
//   curriculumName: string;
//   totalStudents: number;
//   totalFeesOwed: number;
//   totalFeesPaid: number;
//   totalBalance: number;
//   students: StudentSummary[];
// }

interface SchoolFinancialSummary {
  tenantId: string;
  totalStudents: number;
  totalFeesOwed: number;
  totalFeesPaid: number;
  totalBalance: number;
  gradeLevelSummaries: GradeLevelStudentsSummary[];
}

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
    const students = await this.studentRepository
  .createQueryBuilder('student')
  .leftJoinAndSelect('student.user', 'user')
  .leftJoinAndSelect('student.grade', 'grade')
  .leftJoinAndSelect('grade.gradeLevel', 'gradeLevel')
  .leftJoinAndSelect('grade.curriculum', 'curriculum')
  .leftJoinAndSelect('student.stream', 'stream')
  .where('student.tenant_id = :tenantId', { tenantId: user.tenantId })
  .andWhere('student.isActive = true')
  .orderBy('gradeLevel.name', 'ASC')
  .addOrderBy('student.createdAt', 'ASC')
  .getMany();

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

  async getSchoolFinancialSummary(
    user: ActiveUserData,
  ): Promise<SchoolFinancialSummary> {
    const gradeLevelSummaries = await this.getStudentsSummaryByGradeLevel(user);

    const totalStudents = gradeLevelSummaries.reduce(
      (sum, gl) => sum + gl.totalStudents,
      0,
    );
    const totalFeesOwed = gradeLevelSummaries.reduce(
      (sum, gl) => sum + gl.totalFeesOwed,
      0,
    );
    const totalFeesPaid = gradeLevelSummaries.reduce(
      (sum, gl) => sum + gl.totalFeesPaid,
      0,
    );

    return {
      tenantId: user.tenantId,
      totalStudents,
      totalFeesOwed,
      totalFeesPaid,
      totalBalance: totalFeesOwed - totalFeesPaid,
      gradeLevelSummaries,
    };
  }









  // private mapToStudentSummary(
  //   student: Student,
  //   feeItems: any[],
  // ): StudentSummary {
  //   const feeItemSummaries: FeeItemSummary[] = feeItems.map((item) => ({
  //     id: item.id,
  //     feeBucketName: item.fee_bucket_name,
  //     amount: parseFloat(item.amount),
  //     isMandatory: item.isMandatory,
  //     feeStructureName: item.fee_structure_name,
  //     academicYearName: item.academic_year_name,
  //     termName: item.term_name,
  //   }));

  //   const totalOwed = feeItemSummaries.reduce(
  //     (sum, item) => sum + item.amount,
  //     0,
  //   );

  //   return {
  //     id: student.id,
  //     admissionNumber: student.admission_number,
  //     studentName: student.user.name,
  //     email: student.user.email,
  //     phone: student.phone,
  //     gender: student.gender,
  //     schoolType: student.schoolType || 'day',
  //     gradeLevelName: student.grade.gradeLevel.name,
  //     curriculumName: student.grade.curriculum.name,
  //     streamName: student.stream?.name,
  //     feeSummary: {
  //       totalOwed,
  //       totalPaid: student.totalFeesPaid,
  //       balance: totalOwed - student.totalFeesPaid,
  //       numberOfFeeItems: feeItemSummaries.length,
  //       feeItems: feeItemSummaries,
  //     },
  //     isActive: student.isActive,
  //     createdAt: student.createdAt,
  //     updatedAt: student.updatedAt,
  //   };
  // }



  private async updateStudentFeesOwed(
    studentId: string,
    queryRunner?: QueryRunner,
  ): Promise<void> {
    const manager = queryRunner ? queryRunner.manager : this.dataSource.manager;

    const result = await manager.query(
      `
      SELECT COALESCE(SUM(sfi.amount), 0) as total_owed
      FROM student_fee_items sfi
      JOIN student_fee_assignments sfa ON sfi."studentFeeAssignmentId" = sfa.id
      WHERE sfa."studentId" = $1 AND sfi."isActive" = true
    `,
      [studentId],
    );

    const totalOwed = parseFloat(result[0]?.total_owed || 0);

    await manager
      .getRepository(Student)
      .update({ id: studentId }, { feesOwed: totalOwed });
  }

  private async getStudentFeeItems(
    studentId: string,
    tenantId: string,
  ): Promise<any[]> {
    const query = `
      SELECT 
        sfi.id, 
        sfi.amount, 
        COALESCE(sfi."amountPaid", 0) as "amountPaid", 
        sfi."isMandatory",
        fb.name as fee_bucket_name,
        fs.name as fee_structure_name,
        ay.name as academic_year_name,
        COALESCE(t.name, 'N/A') as term_name
      FROM student_fee_items sfi
      JOIN student_fee_assignments sfa ON sfi."studentFeeAssignmentId" = sfa.id
      JOIN fee_structure_items fsi ON sfi."feeStructureItemId" = fsi.id
      JOIN fee_buckets fb ON fsi."feeBucketId" = fb.id
      JOIN fee_assignments fa ON sfa."feeAssignmentId" = fa.id
      JOIN fee_structures fs ON fa."feeStructureId" = fs.id
      JOIN academic_years ay ON fs."academicYearId" = ay.id
      LEFT JOIN fee_structure_terms fst ON fst.fee_structure_id = fs.id    
      LEFT JOIN terms t ON t.id = fst.term_id                              
      WHERE sfa."studentId" = $1
        AND sfi."tenantId" = $2
        AND sfi."isActive" = true
        AND sfa."isActive" = true
      ORDER BY fb.name, fs.name;
    `;
  
    return await this.dataSource.query(query, [studentId, tenantId]);
  }

  private mapToStudentSummary(
    student: Student,
    feeItems: any[],
  ): StudentSummary {
    const feeItemSummaries: FeeItemSummary[] = feeItems.map((item) => {
      const amount = parseFloat(item.amount);
      const amountPaid = parseFloat(item.amountPaid || 0);
      return {
        id: item.id,
        feeBucketName: item.fee_bucket_name,
        amount,
        amountPaid,
        balance: amount - amountPaid,
        isMandatory: item.isMandatory,
        feeStructureName: item.fee_structure_name,
        academicYearName: item.academic_year_name,
        termName: item.term_name,
      };
    });

    const totalOwed = feeItemSummaries.reduce((sum, item) => sum + item.amount, 0);
    const totalPaid = feeItemSummaries.reduce((sum, item) => sum + (('amountPaid' in item) ? (item as any).amountPaid : 0), 0);

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
        totalPaid,
        balance: totalOwed - totalPaid,
        numberOfFeeItems: feeItemSummaries.length,
        feeItems: feeItemSummaries,
      },
      isActive: student.isActive,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    };
  }




  // async getSchoolFinancialSummary(
  //   user: ActiveUserData,
  // ): Promise<SchoolFinancialSummary> {
  //   const gradeLevelSummaries = await this.getStudentsSummaryByGradeLevel(user);

  //   const totalStudents = gradeLevelSummaries.reduce(
  //     (sum, gl) => sum + gl.totalStudents,
  //     0,
  //   );
  //   const totalFeesOwed = gradeLevelSummaries.reduce(
  //     (sum, gl) => sum + gl.totalFeesOwed,
  //     0,
  //   );
  //   const totalFeesPaid = gradeLevelSummaries.reduce(
  //     (sum, gl) => sum + gl.totalFeesPaid,
  //     0,
  //   );

  //   return {
  //     tenantId: user.tenantId,
  //     totalStudents,
  //     totalFeesOwed,
  //     totalFeesPaid,
  //     totalBalance: totalFeesOwed - totalFeesPaid,
  //     gradeLevelSummaries,
  //   };
  // }



  private async getStudentFeeItemsByAcademicYear(
    studentId: string,
    tenantId: string,
    academicYearId: string,
  ): Promise<any[]> {
    const query = `
      SELECT 
        sfi.id, 
        sfi.amount, 
        COALESCE(sfi."amountPaid", 0) as "amountPaid", 
        sfi."isMandatory",
        fb.name as fee_bucket_name,
        fs.name as fee_structure_name,
        ay.name as academic_year_name,
        COALESCE(fa.term_name, 'N/A') as term_name
      FROM student_fee_items sfi
      JOIN student_fee_assignments sfa ON sfi."studentFeeAssignmentId" = sfa.id
      JOIN fee_structure_items fsi ON sfi."feeStructureItemId" = fsi.id
      JOIN fee_buckets fb ON fsi."feeBucketId" = fb.id
      JOIN fee_assignments fa ON sfa."feeAssignmentId" = fa.id
      JOIN fee_structures fs ON fa."feeStructureId" = fs.id
      JOIN academic_years ay ON fs."academicYearId" = ay.id
      WHERE sfa."studentId" = $1
        AND sfi."tenantId" = $2
        AND ay.id = $3
        AND sfi."isActive" = true
        AND sfa."isActive" = true
      ORDER BY fb.name, fs.name;
    `;
  
    return await this.dataSource.query(query, [studentId, tenantId, academicYearId]);
  }

  async getFinancialSummaryByAcademicYear(
    academicYearId: string,
    user: ActiveUserData,
  ): Promise<AcademicYearFinancialSummary> {
    const academicYear = await this.dataSource.query(
      `SELECT id, name FROM academic_years WHERE id = $1 AND "tenantId" = $2`,
      [academicYearId, user.tenantId],
    );
  
    if (!academicYear || academicYear.length === 0) {
      throw new NotFoundException(
        `Academic year ${academicYearId} not found for this tenant`,
      );
    }
  
    // // Get all students
    // const students = await this.studentRepository.find({
    //   where: {
    //     tenant_id: user.tenantId,
    //     isActive: true,
    //   },
    //   relations: [
    //     'user',
    //     'grade',
    //     'grade.gradeLevel',
    //     'grade.curriculum',
    //     'stream',
    //   ],
    //   order: {
    //     grade: { gradeLevel: { sortOrder: 'ASC' } },
    //     createdAt: 'ASC',
    //   } as any,
    // });


    const students = await this.studentRepository
  .createQueryBuilder('student')
  .leftJoinAndSelect('student.user', 'user')
  .leftJoinAndSelect('student.grade', 'grade')
  .leftJoinAndSelect('grade.gradeLevel', 'gradeLevel')
  .leftJoinAndSelect('grade.curriculum', 'curriculum')
  .leftJoinAndSelect('student.stream', 'stream')
  .where('student.tenant_id = :tenantId', { tenantId: user.tenantId })
  .andWhere('student.isActive = true')
  .orderBy('gradeLevel.sortOrder', 'ASC')
  .addOrderBy('student.createdAt', 'ASC')
  .getMany();

  
    // Group by grade level
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
          // Get fee items filtered by academic year
          const feeItems = await this.getStudentFeeItemsByAcademicYear(
            student.id,
            user.tenantId,
            academicYearId,
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
  
    const totalStudents = gradeLevelSummaries.reduce(
      (sum, gl) => sum + gl.totalStudents,
      0,
    );
    const totalFeesOwed = gradeLevelSummaries.reduce(
      (sum, gl) => sum + gl.totalFeesOwed,
      0,
    );
    const totalFeesPaid = gradeLevelSummaries.reduce(
      (sum, gl) => sum + gl.totalFeesPaid,
      0,
    );
  
    return {
      tenantId: user.tenantId,
      academicYearId,
      academicYearName: academicYear[0].name,
      totalStudents,
      totalFeesOwed,
      totalFeesPaid,
      totalBalance: totalFeesOwed - totalFeesPaid,
      gradeLevelSummaries,
    };
  }








}