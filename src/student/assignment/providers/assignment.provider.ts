import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AssignmentStatus, GetAssignmentsArgs } from '../dtos/get-assignments.args';
import { Assignment, AssignmentSubmission } from '../dtos/assignment-response.dto';
import { CreateAssignmentSubmissionInput } from '../dtos/create-assignment-submission.input';
import { Student } from 'src/admin/student/entities/student.entity';

@Injectable()
export class AssignmentProvider {
  constructor(private readonly dataSource: DataSource) {}

  async getStudentAssignments(
    studentId: string,
    tenantId: string,
    args: GetAssignmentsArgs,
  ): Promise<{ assignments: Assignment[]; total: number }> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();

    try {
      // First, get the student's grade level
      const studentQuery = `
      SELECT tgl.id as grade_level_id
      FROM students s
      JOIN tenant_grade_level tgl ON s.grade_level_id = tgl.id
      WHERE s.id = $1 AND s.tenant_id = $2
    `;
      const studentResult = await qr.query(studentQuery, [studentId, tenantId]);
      
      if (!studentResult.length) {
        throw new Error('Student not found or not in this tenant');
      }

      const gradeLevelId = studentResult[0].grade_level_id;

      // Build the assignments query
      let whereConditions = ['t.tenant_id = $3', 'tgl.id = $4'];
      let params = [args.limit, args.offset, tenantId, gradeLevelId];
      let paramIndex = 5;

      if (args.subjectId) {
        whereConditions.push(`ts.id = $${paramIndex}`);
        params.push(args.subjectId);
        paramIndex++;
      }

      // Base query for assignments
      const baseQuery = `
FROM test t
JOIN tenant_grade_level tgl ON t.id = ANY(
  SELECT ttgl.test_id
  FROM test_tenant_grade_levels ttgl
  WHERE ttgl.tenant_grade_level_id = tgl.id
)
JOIN tenant_subject ts ON t.tenant_subject_id = ts.id
JOIN users teacher ON t.teacher_id = teacher.id
-- check if you actually have test_submissions or need to link assessment_marks
LEFT JOIN test_submissions sub ON t.id = sub.test_id AND sub.student_id = $5
WHERE ${whereConditions.join(' AND ')}
      `;

      // Add student ID to params for the main query
      const mainParams = [...params];
      mainParams.splice(4, 0, studentId); // Insert studentId at position 4

      // Get total count
      const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
      const countResult = await qr.query(countQuery, mainParams);
      const total = parseInt(countResult[0].total);

      // Get assignments with pagination
      const assignmentsQuery = `
        SELECT 
          t.id,
          t.title,
          t.instructions as description,
          t.date as due_date,
          t.total_marks,
          t.resource_url,
          t.created_at,
          t.updated_at,
          ts.id as subject_id,
          ts.name as subject_name,
          teacher.id as teacher_id,
          teacher.first_name as teacher_first_name,
          teacher.last_name as teacher_last_name,
          teacher.email as teacher_email,
          sub.id as submission_id,
          sub.submission_text,
          sub.file_url as submission_file_url,
          sub.comments as submission_comments,
          sub.submitted_at,
          sub.grade,
          sub.feedback,
          sub.graded_at
        ${baseQuery}
        ORDER BY t.date DESC
        LIMIT $1 OFFSET $2
      `;

      const assignmentsResult = await qr.query(assignmentsQuery, mainParams);

      const assignments = assignmentsResult.map(row => {
        // Determine status
        let status: AssignmentStatus;
        if (row.submission_id) {
          if (row.grade !== null) {
            status = AssignmentStatus.GRADED;
          } else {
            status = AssignmentStatus.SUBMITTED;
          }
        } else {
          const dueDate = new Date(row.due_date);
          const now = new Date();
          status = now > dueDate ? AssignmentStatus.OVERDUE : AssignmentStatus.PENDING;
        }

        return {
          id: row.id,
          title: row.title,
          description: row.description || '',
          dueDate: new Date(row.due_date),
          totalMarks: row.total_marks,
          resourceUrl: row.resource_url,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
          subject: {
            id: row.subject_id,
            name: row.subject_name,
          },
          teacher: {
            id: row.teacher_id,
            firstName: row.teacher_first_name,
            lastName: row.teacher_last_name,
            email: row.teacher_email,
          },
          submission: row.submission_id ? {
            id: row.submission_id,
            submissionText: row.submission_text,
            fileUrl: row.submission_file_url,
            comments: row.submission_comments,
            submittedAt: new Date(row.submitted_at),
            grade: row.grade,
            feedback: row.feedback,
            gradedAt: row.graded_at ? new Date(row.graded_at) : null,
          } : null,
          status,
        } as Assignment;
      });

      // Filter by status if specified
      const filteredAssignments = args.status 
        ? assignments.filter((assignment: any) => assignment.status === args.status)
        : assignments;

      return {
        assignments: filteredAssignments,
        total: args.status ? filteredAssignments.length : total,
      };
    } finally {
      await qr.release();
    }
  }

  async getAssignmentById(
    assignmentId: string,
    studentId: string,
    tenantId: string,
  ): Promise<Assignment | null> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();

    try {
      // Verify student belongs to tenant and get grade level
      const studentQuery = `
        SELECT tgl.id as grade_level_id
        FROM students s
        JOIN tenant_grade_levels tgl ON s.tenant_grade_level_id = tgl.id
        WHERE s.id = $1 AND s.tenant_id = $2
      `;
      const studentResult = await qr.query(studentQuery, [studentId, tenantId]);
      
      if (!studentResult.length) {
        return null;
      }

      const gradeLevelId = studentResult[0].grade_level_id;

      const query = `
        SELECT 
          t.id,
          t.title,
          t.instructions as description,
          t.date as due_date,
          t.total_marks,
          t.resource_url,
          t.created_at,
          t.updated_at,
          ts.id as subject_id,
          ts.name as subject_name,
          teacher.id as teacher_id,
          teacher.first_name as teacher_first_name,
          teacher.last_name as teacher_last_name,
          teacher.email as teacher_email,
          sub.id as submission_id,
          sub.submission_text,
          sub.file_url as submission_file_url,
          sub.comments as submission_comments,
          sub.submitted_at,
          sub.grade,
          sub.feedback,
          sub.graded_at
        FROM tests t
        JOIN tenant_grade_levels tgl ON t.id = ANY(
          SELECT tgl_test.test_id 
          FROM test_grade_levels tgl_test 
          WHERE tgl_test.grade_level_id = tgl.id
        )
        JOIN tenant_subjects ts ON t.tenant_subject_id = ts.id
        JOIN users teacher ON t.teacher_id = teacher.id
        LEFT JOIN test_submissions sub ON t.id = sub.test_id AND sub.student_id = $3
        WHERE t.id = $1 AND t.tenant_id = $2 AND tgl.id = $4
      `;

      const result = await qr.query(query, [assignmentId, tenantId, studentId, gradeLevelId]);

      if (!result.length) {
        return null;
      }

      const row = result[0];
      
      // Determine status
      let status: AssignmentStatus;
      if (row.submission_id) {
        if (row.grade !== null) {
          status = AssignmentStatus.GRADED;
        } else {
          status = AssignmentStatus.SUBMITTED;
        }
      } else {
        const dueDate = new Date(row.due_date);
        const now = new Date();
        status = now > dueDate ? AssignmentStatus.OVERDUE : AssignmentStatus.PENDING;
      }

      return {
        id: row.id,
        title: row.title,
        description: row.description || '',
        dueDate: new Date(row.due_date),
        totalMarks: row.total_marks,
        resourceUrl: row.resource_url,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        subject: {
          id: row.subject_id,
          name: row.subject_name,
        },
        teacher: {
          id: row.teacher_id,
          firstName: row.teacher_first_name,
          lastName: row.teacher_last_name,
          email: row.teacher_email,
        },
        submission: row.submission_id ? {
          id: row.submission_id,
          submissionText: row.submission_text,
          fileUrl: row.submission_file_url,
          comments: row.submission_comments,
          submittedAt: new Date(row.submitted_at),
          grade: row.grade,
          feedback: row.feedback,
          gradedAt: row.graded_at ? new Date(row.graded_at) : null,
        } : null,
        status,
      } as Assignment;
    } finally {
      await qr.release();
    }
  }

  async submitAssignment(
    input: CreateAssignmentSubmissionInput,
    studentId: string,
    tenantId: string,
  ): Promise<AssignmentSubmission> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const assignment = await this.getAssignmentById(input.assignmentId, studentId, tenantId);
      if (!assignment) {
        throw new Error('Assignment not found or not accessible');
      }

      if (assignment.submission) {
        throw new Error('Assignment already submitted');
      }

      const submissionId = require('uuid').v4();
      const insertQuery = `
        INSERT INTO test_submissions (
          id, test_id, student_id, submission_text, file_url, comments, submitted_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const now = new Date();
      const result = await qr.query(insertQuery, [
        submissionId,
        input.assignmentId,
        studentId,
        input.submissionText,
        input.fileUrl,
        input.comments,
        now,
      ]);

      await qr.commitTransaction();

      const submission = result[0];
      return {
        id: submission.id,
        submissionText: submission.submission_text,
        fileUrl: submission.file_url,
        comments: submission.comments,
        submittedAt: new Date(submission.submitted_at),
        grade: submission.grade,
        feedback: submission.feedback,
        gradedAt: submission.graded_at ? new Date(submission.graded_at) : undefined,
      };
    } catch (error) {
      await qr.rollbackTransaction();
      throw error;
    } finally {
      await qr.release();
    }
  }

  async getStudentByUserId(userId: string, tenantId: string): Promise<Student | null> {
    return this.dataSource.getRepository(Student).findOne({
      where: { user_id: userId, tenant_id: tenantId },
      relations: ['user', 'grade', 'stream'],
    });
  }
  
}
   