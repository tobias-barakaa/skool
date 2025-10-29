import { Injectable, NotFoundException, BadRequestException, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource, Not, Between } from 'typeorm';
import { Student } from 'src/admin/student/entities/student.entity';
import { Teacher } from 'src/admin/teacher/entities/teacher.entity';
import { ParentStudent } from 'src/admin/parent/entities/parent-student.entity';
import { Parent } from 'src/admin/parent/entities/parent.entity';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { Attendance, AttendanceStatus } from 'src/teacher/attendance/entities/attendance.entity';

@Injectable()
export class StudentAttendanceService {
  private readonly logger = new Logger(StudentAttendanceService.name);

  constructor(
   
    
    private readonly dataSource: DataSource,
    
  ) {}

async getMyAttendance(
    user: ActiveUserData,
    startDate?: string,
    endDate?: string,
  ): Promise<Attendance[]> {
    const attendanceRepository = this.dataSource.getRepository(Attendance);
    const studentRepository = this.dataSource.getRepository(Student);
    const student = await studentRepository.findOne({
      where: { user_id: user.sub, tenant_id: user.tenantId, isActive: true },
    });
  
    if (!student) {
      throw new NotFoundException('Student record not found');
    }
  
    const where: any = {
      studentId: student.id,
      tenantId: user.tenantId,
    };
  
    if (startDate && endDate) {
      where.date = Between(startDate, endDate);
    }
  
    return await attendanceRepository.find({
      where,
      order: { date: 'DESC' },
      relations: ['teacher', 'teacher.user'],
    });
  }
  


  async getSummary(user: ActiveUserData) {
    const attendanceRepository = this.dataSource.getRepository(Attendance);
    const studentRepository = this.dataSource.getRepository(Student);
  
    // 1️⃣ Get the student record for the logged-in user
    const student = await studentRepository.findOne({
      where: { user_id: user.sub, tenant_id: user.tenantId, isActive: true },
      relations: ['grade', 'grade.gradeLevel'], // optional if you want grade info
    });
  
    if (!student) {
      throw new NotFoundException('Student record not found');
    }
  
    // 2️⃣ Fetch attendance records for this student
    const records = await attendanceRepository.find({
      where: {
        student: { id: student.id },
        tenantId: user.tenantId,
      },
      relations: ['student', 'student.grade'], 
      order: { date: 'DESC' },
    });
  
    // 3️⃣ Build summary stats
    const summary = {
      totalDays: records.length,
      presentDays: records.filter(r => r.status === AttendanceStatus.PRESENT).length,
      absentDays: records.filter(r => r.status === AttendanceStatus.ABSENT).length,
      suspendedDays: records.filter(r => r.status === AttendanceStatus.SUSPENDED).length,
      lateDays: records.filter(r => r.status === AttendanceStatus.LATE).length,
    };
  
    // 4️⃣ Return structured result
    return {
      ...summary,
      percentage:
        summary.totalDays > 0
          ? (summary.presentDays / summary.totalDays) * 100
          : 0,
      records: records.map(r => ({
        date: r.date,
        status: r.status,
        grade: r.student?.grade?.name ?? null, // optional extra info
      })),
    };
  }
  

}
  