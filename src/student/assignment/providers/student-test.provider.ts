// src/students/tests/providers/student-test.provider.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { Test } from 'src/teacher/test/entities/test.entity';
import { Student } from 'src/admin/student/entities/student.entity';

@Injectable()
export class StudentTestProvider {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Get all tests/assignments for a student based on their grade level
   * @param student - Active student user data
   * @returns Array of tests assigned to the student's grade level
   */
  async getStudentTests(student: ActiveUserData): Promise<Test[]> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();

    try {
      // 1. Find the student record with their grade level
      const studentRecord = await qr.manager.findOne(Student, {
        where: { 
          user_id: student.sub,
          tenant_id: student.tenantId,
          isActive: true
        },
        relations: ['grade', 'grade.gradeLevel'],
      });

      if (!studentRecord) {
        throw new NotFoundException('Student record not found');
      }

      if (!studentRecord.grade) {
        throw new BadRequestException('Student is not assigned to a grade level');
      }

      // 2. Find all tests that include this student's grade level
      const tests = await qr.manager
  .createQueryBuilder(Test, 'test')
  .leftJoinAndSelect('test.subject', 'subject')
  .leftJoinAndSelect('test.gradeLevels', 'gradeLevels')
  .leftJoinAndSelect('gradeLevels.gradeLevel', 'gradeLevel') // 👈 ensure it's joined
  .leftJoinAndSelect('test.questions', 'questions')
  .leftJoinAndSelect('questions.options', 'options')
  .leftJoinAndSelect('test.referenceMaterials', 'referenceMaterials')
  .leftJoinAndSelect('test.teacher', 'teacher')
  .where('gradeLevels.id = :gradeLevelId', { gradeLevelId: studentRecord.grade.id })
  .andWhere('subject.tenant.id = :tenantId', { tenantId: student.tenantId })
  .orderBy('test.date', 'DESC')
  .addOrderBy('test.createdAt', 'DESC')
  .addOrderBy('questions.order', 'ASC')
  .addOrderBy('options.order', 'ASC')
  .getMany();

// Filter out bad records to prevent GraphQL null return
tests.forEach(test => {
  test.gradeLevels = test.gradeLevels.filter(gl => gl.gradeLevel);
});

return tests;

    } finally {
      await qr.release();
    }
  }

  /**
   * Get a single test by ID for a student
   * @param testId - Test UUID
   * @param student - Active student user data
   * @returns Single test with all details
   */
  async getStudentTestById(testId: string, student: ActiveUserData): Promise<Test> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();

    try {
      // 1. Find the student record
      const studentRecord = await qr.manager.findOne(Student, {
        where: { 
          user_id: student.sub,
          tenant_id: student.tenantId,
          isActive: true
        },
        relations: ['grade'],
      });

      if (!studentRecord) {
        throw new NotFoundException('Student record not found');
      }

      // 2. Find the test and verify student has access
      const test = await qr.manager
        .createQueryBuilder(Test, 'test')
        .leftJoinAndSelect('test.subject', 'subject')
        .leftJoinAndSelect('test.gradeLevels', 'gradeLevels')
        .leftJoinAndSelect('test.questions', 'questions')
        .leftJoinAndSelect('questions.options', 'options')
        .leftJoinAndSelect('test.referenceMaterials', 'referenceMaterials')
        .leftJoinAndSelect('test.teacher', 'teacher')
        .where('test.id = :testId', { testId })
        .andWhere('gradeLevels.id = :gradeLevelId', { 
          gradeLevelId: studentRecord.grade.id 
        })
        .andWhere('subject.tenant.id = :tenantId', { 
          tenantId: student.tenantId 
        })
        .orderBy('questions.order', 'ASC')
        .addOrderBy('options.order', 'ASC')
        .getOne();

      if (!test) {
        throw new NotFoundException(
          'Test not found or you do not have access to this test'
        );
      }

      return test;
    } finally {
      await qr.release();
    }
  }

  /**
   * Get count of tests by status for a student
   * @param student - Active student user data
   * @returns Object with counts for pending, active, and completed tests
   */
  async getStudentTestCounts(student: ActiveUserData): Promise<{
    total: number;
    pending: number;
    active: number;
    completed: number;
  }> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();

    try {
      // 1. Find the student record
      const studentRecord = await qr.manager.findOne(Student, {
        where: { 
          user_id: student.sub,
          tenant_id: student.tenantId,
          isActive: true
        },
        relations: ['grade'],
      });

      if (!studentRecord) {
        throw new NotFoundException('Student record not found');
      }

      // 2. Get counts by status
      const baseQuery = qr.manager
        .createQueryBuilder(Test, 'test')
        .leftJoin('test.gradeLevels', 'gradeLevels')
        .leftJoin('test.subject', 'subject')
        .where('gradeLevels.id = :gradeLevelId', { 
          gradeLevelId: studentRecord.grade.id 
        })
        .andWhere('subject.tenant.id = :tenantId', { 
          tenantId: student.tenantId 
        });

      const total = await baseQuery.getCount();

      const pending = await baseQuery
        .andWhere('test.status = :status', { status: 'pending' })
        .getCount();

      const active = await qr.manager
        .createQueryBuilder(Test, 'test')
        .leftJoin('test.gradeLevels', 'gradeLevels')
        .leftJoin('test.subject', 'subject')
        .where('gradeLevels.id = :gradeLevelId', { 
          gradeLevelId: studentRecord.grade.id 
        })
        .andWhere('subject.tenant.id = :tenantId', { 
          tenantId: student.tenantId 
        })
        .andWhere('test.status = :status', { status: 'active' })
        .getCount();

      const completed = await qr.manager
        .createQueryBuilder(Test, 'test')
        .leftJoin('test.gradeLevels', 'gradeLevels')
        .leftJoin('test.subject', 'subject')
        .where('gradeLevels.id = :gradeLevelId', { 
          gradeLevelId: studentRecord.grade.id 
        })
        .andWhere('subject.tenant.id = :tenantId', { 
          tenantId: student.tenantId 
        })
        .andWhere('test.status = :status', { status: 'completed' })
        .getCount();

      return {
        total,
        pending,
        active,
        completed,
      };
    } finally {
      await qr.release();
    }
  }

  /**
   * Get upcoming tests for a student (within next 7 days)
   * @param student - Active student user data
   * @returns Array of upcoming tests
   */
  async getUpcomingTests(student: ActiveUserData): Promise<Test[]> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();

    try {
      const studentRecord = await qr.manager.findOne(Student, {
        where: { 
          user_id: student.sub,
          tenant_id: student.tenantId,
          isActive: true
        },
        relations: ['grade'],
      });

      if (!studentRecord) {
        throw new NotFoundException('Student record not found');
      }

      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      const tests = await qr.manager
        .createQueryBuilder(Test, 'test')
        .leftJoinAndSelect('test.subject', 'subject')
        .leftJoinAndSelect('test.gradeLevels', 'gradeLevels')
        .leftJoinAndSelect('test.teacher', 'teacher')
        .where('gradeLevels.id = :gradeLevelId', { 
          gradeLevelId: studentRecord.grade.id 
        })
        .andWhere('subject.tenant.id = :tenantId', { 
          tenantId: student.tenantId 
        })
        .andWhere('test.date >= :today', { today })
        .andWhere('test.date <= :nextWeek', { nextWeek })
        .andWhere('test.status IN (:...statuses)', { 
          statuses: ['pending', 'active'] 
        })
        .orderBy('test.date', 'ASC')
        .addOrderBy('test.startTime', 'ASC')
        .getMany();

      return tests;
    } finally {
      await qr.release();
    }
  }

  /**
   * Get tests filtered by status
   * @param status - Test status (pending, active, completed)
   * @param student - Active student user data
   * @returns Array of tests with specified status
   */
  async getTestsByStatus(
    status: 'pending' | 'active' | 'completed',
    student: ActiveUserData
  ): Promise<Test[]> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();

    try {
      const studentRecord = await qr.manager.findOne(Student, {
        where: { 
          user_id: student.sub,
          tenant_id: student.tenantId,
          isActive: true
        },
        relations: ['grade'],
      });

      if (!studentRecord) {
        throw new NotFoundException('Student record not found');
      }

      const tests = await qr.manager
        .createQueryBuilder(Test, 'test')
        .leftJoinAndSelect('test.subject', 'subject')
        .leftJoinAndSelect('test.gradeLevels', 'gradeLevels')
        .leftJoinAndSelect('test.questions', 'questions')
        .leftJoinAndSelect('test.referenceMaterials', 'referenceMaterials')
        .leftJoinAndSelect('test.teacher', 'teacher')
        .where('gradeLevels.id = :gradeLevelId', { 
          gradeLevelId: studentRecord.grade.id 
        })
        .andWhere('subject.tenant.id = :tenantId', { 
          tenantId: student.tenantId 
        })
        .andWhere('test.status = :status', { status })
        .orderBy('test.date', 'DESC')
        .addOrderBy('test.createdAt', 'DESC')
        .getMany();

      return tests;
    } finally {
      await qr.release();
    }
  }
}
