// import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
// import { AssignmentProvider } from './providers/assignment.provider';
// import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
// import { Assignment, AssignmentsResponse, AssignmentSubmission } from './dtos/assignment-response.dto';
// import { GetAssignmentsArgs } from './dtos/get-assignments.args';
// import { CreateAssignmentSubmissionInput } from './dtos/create-assignment-submission.input';

// @Injectable()
// export class AssignmentService {
//   constructor(private readonly assignmentProvider: AssignmentProvider) {}

//   async getStudentAssignments(
//     currentUser: ActiveUserData,
//     args: GetAssignmentsArgs,

//   ): Promise<AssignmentsResponse> {
//     try {
//         const studentRecord = await this.assignmentProvider.getStudentByUserId(
//             currentUser.sub,      
//             currentUser.tenantId, 
//           );

//       if (!studentRecord) {
//         throw new NotFoundException('Student not found');
//       }

//       const { assignments, total } = await this.assignmentProvider.getStudentAssignments(
//         studentRecord.id,
//         currentUser.tenantId,
//         args,
//       );

//       const limit = args.limit || 10;
//       const currentPage = Math.floor((args.offset || 0) / limit) + 1;
//       const totalPages = Math.ceil(total / limit);

//       return {
//         assignments,
//         total,
//         totalPages,
//         currentPage,
//       };
//     } catch (error) {
//       console.error('Error in getStudentAssignments:', error);
//       if (error instanceof NotFoundException) {
//         throw error;
//       }
//       throw new BadRequestException(error.message || 'Failed to fetch assignments');
//     }
//   }

//   async getAssignmentById(
//     assignmentId: string,
//     student: ActiveUserData,
//   ): Promise<Assignment> {
//     try {
//       // Get student record
//       const studentRecord = await this.assignmentProvider.getStudentByUserId(
//         student.sub,
//         student.tenantId,
//       );

//       if (!studentRecord) {
//         throw new NotFoundException('Student not found');
//       }

//       const assignment = await this.assignmentProvider.getAssignmentById(
//         assignmentId,
//         studentRecord.id,
//         student.tenantId,
//       );

//       if (!assignment) {
//         throw new NotFoundException('Assignment not found or not accessible');
//       }

//       return assignment;
//     } catch (error) {
//       console.error('Error in getAssignmentById:', error);
//       if (error instanceof NotFoundException) {
//         throw error;
//       }
//       throw new BadRequestException(error.message || 'Failed to fetch assignment');
//     }
//   }

//   async submitAssignment(
//     input: CreateAssignmentSubmissionInput,
//     student: ActiveUserData,
//   ): Promise<AssignmentSubmission> {
//     try {
//       // Get student record
//       const studentRecord = await this.assignmentProvider.getStudentByUserId(
//         student.sub,
//         student.tenantId,
//       );

//       if (!studentRecord) {
//         throw new NotFoundException('Student not found');
//       }

//       return await this.assignmentProvider.submitAssignment(
//         input,
//         studentRecord.id,
//         student.tenantId,
//       );
//     } catch (error) {
//       console.error('Error in submitAssignment:', error);
//       if (error instanceof NotFoundException) {
//         throw error;
//       }
//       throw new BadRequestException(error.message || 'Failed to submit assignment');
//     }
//   }
// }