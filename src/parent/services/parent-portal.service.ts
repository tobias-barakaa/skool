// parent-portal.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { StudentFeeAssignment } from 'src/admin/finance/fee-assignment/entities/student_fee_assignments.entity';
import { StudentFeeItem } from 'src/admin/finance/fee-assignment/entities/student_fee_items.entity';
import { Payment } from 'src/admin/finance/payment/entities/payment.entity';
import { ParentStudent } from 'src/admin/parent/entities/parent-student.entity';
import { Parent } from 'src/admin/parent/entities/parent.entity';
import { Student } from 'src/admin/student/entities/student.entity';
import { Attendance, AttendanceStatus } from 'src/teacher/attendance/entities/attendance.entity';
import { AssessmentMark } from 'src/teacher/marksheet/entities/assessment_marks-entity';
import { Repository, Between } from 'typeorm';

@Injectable()
export class ParentPortalService {
  constructor(
    @InjectRepository(Parent)
    private parentRepo: Repository<Parent>,
    @InjectRepository(ParentStudent)
    private parentStudentRepo: Repository<ParentStudent>,
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(Attendance)
    private attendanceRepo: Repository<Attendance>,
    @InjectRepository(StudentFeeAssignment)
    private studentFeeAssignmentRepo: Repository<StudentFeeAssignment>,
    @InjectRepository(StudentFeeItem)
    private studentFeeItemRepo: Repository<StudentFeeItem>,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(AssessmentMark)
    private assessmentMarkRepo: Repository<AssessmentMark>,
  ) {}

  // Get parent by userId
  async getParentByUserId(userId: string, tenantId: string): Promise<Parent> {
    const parent = await this.parentRepo.findOne({
      where: { userId, tenantId, isActive: true },
      relations: ['parentStudents', 'parentStudents.student', 'parentStudents.student.user', 'parentStudents.student.grade'],
    });

    if (!parent) {
      throw new NotFoundException('Parent profile not found');
    }

    return parent;
  }

  // Get all children for a parent
  async getMyChildren(user: ActiveUserData) {
    const parent = await this.getParentByUserId(user.sub, user.tenantId);
    
    return parent.parentStudents.map(ps => ({
      id: ps.student.id,
      name: ps.student.user.name,
      admissionNumber: ps.student.admission_number,
      grade: ps.student.grade,
      relationship: ps.relationship,
      isPrimary: ps.isPrimary,
      phone: ps.student.phone,
      gender: ps.student.gender,
      isActive: ps.student.isActive,
    }));
  }

  // Helper method to verify parent-student relationship
  private async verifyParentStudentRelationship(
    userId: string,
    studentId: string,
    tenantId: string,
  ): Promise<void> {
    const parent = await this.parentRepo.findOne({
      where: { userId, tenantId, isActive: true },
    });

    if (!parent) {
      throw new NotFoundException('Parent profile not found');
    }

    const relationship = await this.parentStudentRepo.findOne({
      where: { parentId: parent.id, studentId, tenantId },
    });

    if (!relationship) {
      throw new ForbiddenException('You do not have access to this student');
    }
  }

  // Get child profile
  async getChildProfile(studentId: string, user: ActiveUserData) {
    await this.verifyParentStudentRelationship(user.sub, studentId, user.tenantId);

    const student = await this.studentRepo.findOne({
      where: { id: studentId, tenant_id: user.tenantId },
      relations: ['user', 'grade', 'stream', 'tenant'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return {
      id: student.id,
      name: student.user.name,
      admissionNumber: student.admission_number,
      phone: student.phone,
      gender: student.gender,
      grade: student.grade,
      stream: student.stream,
      schoolType: student.schoolType,
      feesOwed: student.feesOwed,
      totalFeesPaid: student.totalFeesPaid,
      isActive: student.isActive,
      createdAt: student.createdAt,
    };
  }

  // Get attendance summary for a child
  async getChildAttendanceSummary(
    studentId: string,
    startDate: string,
    endDate: string,
    user: ActiveUserData,
  ) {
    await this.verifyParentStudentRelationship(user.sub, studentId, user.tenantId);

    const attendances = await this.attendanceRepo.find({
      where: {
        studentId,
        tenantId: user.tenantId,
        date: Between(startDate, endDate),
      },
    });

    const summary = {
      totalDays: attendances.length,
      present: attendances.filter(a => a.status === AttendanceStatus.PRESENT).length,
      absent: attendances.filter(a => a.status === AttendanceStatus.ABSENT).length,
      late: attendances.filter(a => a.status === AttendanceStatus.LATE).length,
      suspended: attendances.filter(a => a.status === AttendanceStatus.SUSPENDED).length,
    };

    return {
      ...summary,
      attendanceRate: summary.totalDays > 0 
        ? ((summary.present + summary.late) / summary.totalDays * 100).toFixed(2) 
        : '0',
    };
  }

  // Get detailed attendance records
  async getChildAttendanceDetails(
    studentId: string,
    startDate: string,
    endDate: string,
    user: ActiveUserData,
  ) {
    await this.verifyParentStudentRelationship(user.sub, studentId, user.tenantId);

    return this.attendanceRepo.find({
      where: {
        studentId,
        tenantId: user.tenantId,
        date: Between(startDate, endDate),
      },
      relations: ['teacher', 'teacher.user'],
      order: { date: 'DESC' },
    });
  }

  // Get fee balance and details
  async getChildFeeBalance(studentId: string, user: ActiveUserData) {
    await this.verifyParentStudentRelationship(user.sub, studentId, user.tenantId);

    const student = await this.studentRepo.findOne({
      where: { id: studentId, tenant_id: user.tenantId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const feeAssignments = await this.studentFeeAssignmentRepo.find({
      where: { studentId, tenantId: user.tenantId, isActive: true },
      relations: ['feeAssignment', 'feeAssignment.feeStructure', 'feeItems', 'feeItems.feeStructureItem', 'feeItems.feeStructureItem.feeBucket'],
    });

    let totalDue = 0;
    const itemsBreakdown: Array<{
      id: string;
      bucketName: string;
      itemName: any;
      amount: number;
      amountPaid: number;
      balance: number;
      isMandatory: boolean;
    }> = [];

    for (const assignment of feeAssignments) {
      for (const item of assignment.feeItems) {
        const balance = item.amount - item.amountPaid;
        totalDue += balance;
        
        itemsBreakdown.push({
          id: item.id,
          bucketName: item.feeStructureItem.feeBucket.name,
          itemName: (item.feeStructureItem as any).name ?? (item.feeStructureItem as any).title ?? null,
          amount: item.amount,
          amountPaid: item.amountPaid,
          balance,
          isMandatory: item.isMandatory,
        });
      }
    }

    return {
      studentId,
      totalDue,
      totalPaid: student.totalFeesPaid,
      feesOwed: student.feesOwed,
      items: itemsBreakdown,
    };
  }

//   // Get payment history
//   async getChildPaymentHistory(studentId: string, user: ActiveUserData) {
//     await this.verifyParentStudentRelationship(user.sub, studentId, user.tenantId);

//     return this.paymentRepo.find({
//       where: { studentId, tenantId: user.tenantId },
//       relations: ['invoice', 'receivedByUser'],
//       order: { paymentDate: 'DESC' },
//     });
//   }

//   // Get academic performance
//   async getChildPerformance(
//     studentId: string,
//     term?: number,
//     academicYear?: string,
//     user?: ActiveUserData,
//   ) {
//     await this.verifyParentStudentRelationship(user.sub, studentId, user.tenantId);

//     const queryBuilder = this.assessmentMarkRepo
//       .createQueryBuilder('mark')
//       .leftJoinAndSelect('mark.assessment', 'assessment')
//       .leftJoinAndSelect('assessment.subject', 'subject')
//       .leftJoinAndSelect('assessment.assessmentType', 'assessmentType')
//       .where('mark.studentId = :studentId', { studentId });

//     if (term) {
//       queryBuilder.andWhere('assessment.term = :term', { term });
//     }

//     if (academicYear) {
//       queryBuilder.andWhere('assessment.academicYear = :academicYear', { academicYear });
//     }

//     const marks = await queryBuilder.orderBy('assessment.createdAt', 'DESC').getMany();

//     // Group by subject
//     const bySubject = marks.reduce((acc, mark) => {
//       const subjectId = mark.assessment.subject.id;
//       if (!acc[subjectId]) {
//         acc[subjectId] = {
//           subjectId,
//           subjectName: mark.assessment.subject.name,
//           marks: [],
//           average: 0,
//         };
//       }
//       acc[subjectId].marks.push({
//         id: mark.id,
//         score: mark.score,
//         maxScore: mark.assessment.maxScore,
//         assessmentType: mark.assessment.assessmentType.name,
//         term: mark.assessment.term,
//         academicYear: mark.assessment.academicYear,
//         date: mark.createdAt,
//       });
//       return acc;
//     }, {});

//     // Calculate averages
//     Object.values(bySubject).forEach((subject: any) => {
//       const total = subject.marks.reduce((sum, m) => sum + m.score, 0);
//       subject.average = subject.marks.length > 0 ? total / subject.marks.length : 0;
//     });

//     return Object.values(bySubject);
//   }

//   // Get report card data
  async getChildReportCard(
    studentId: string,
    term: number,
    academicYear: string,
    user: ActiveUserData,
  ) {
    await this.verifyParentStudentRelationship(user.sub, studentId, user.tenantId);

    const student = await this.studentRepo.findOne({
      where: { id: studentId, tenant_id: user.tenantId },
      relations: ['user', 'grade', 'stream'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const marks = await this.assessmentMarkRepo
  .createQueryBuilder('mark')
  .leftJoinAndSelect('mark.assessment', 'assessment')
  .leftJoinAndSelect('assessment.curriculumSubject', 'curriculumSubject')
  .leftJoinAndSelect('curriculumSubject.subject', 'subject')
  .leftJoinAndSelect('assessment.assessmentType', 'assessmentType')
  .where('mark.studentId = :studentId', { studentId })
  .andWhere('assessment.term = :term', { term })
  .andWhere('assessment.academicYear = :academicYear', { academicYear })
  .getMany();


    const subjectResults = marks.reduce((acc, mark) => {
      const assessment = mark.assessment as any;
      // const subject = assessment.subject;
    const subject = assessment.curriculumSubject.subject;

      const subjectId = subject.id;
      if (!acc[subjectId]) {
        acc[subjectId] = {
          subject: subject.name,
          scores: [],
          total: 0,
          average: 0,
        };
      }
      acc[subjectId].scores.push({
        type: assessment.assessmentType.name,
        score: mark.score,
        maxScore: assessment.maxScore,
      });
      return acc;
    }, {});

    // Calculate totals and averages
    Object.values(subjectResults).forEach((result: any) => {
      result.total = result.scores.reduce((sum, s) => sum + s.score, 0);
      result.average = result.scores.length > 0 ? result.total / result.scores.length : 0;
    });

    const subjectResultsArray = Object.values(subjectResults) as Array<{ average: number }>;
    const overallAverage = subjectResultsArray.length > 0
      ? subjectResultsArray.reduce((sum, r) => sum + (r.average ?? 0), 0) / subjectResultsArray.length
      : 0;

    return {
      student: {
        name: student.user.name,
        admissionNumber: student.admission_number,
        grade: student.grade.gradeLevel.name,
        stream: student.stream?.name,
      },
      term,
      academicYear,
      subjects: Object.values(subjectResults),
      overallAverage,
      totalSubjects: Object.keys(subjectResults).length,
    };
  }

//   // Helper method to verify parent-student relationship
//   private async verifyParentStudentRelationship(
//     userId: string,
//     studentId: string,
//     tenantId: string,
//   ): Promise<void> {
//     const parent = await this.parentRepo.findOne({
//       where: { userId, tenantId, isActive: true },
//     });

//     if (!parent) {
//       throw new NotFoundException('Parent profile not found');
//     }

//     const relationship = await this.parentStudentRepo.findOne({
//       where: { parentId: parent.id, studentId, tenantId },
//     });

//     if (!relationship) {
//       throw new ForbiddenException('You do not have access to this student');
//     }
//   }
}