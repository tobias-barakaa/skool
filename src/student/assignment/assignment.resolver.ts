import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { Assignment, AssignmentsResponse, AssignmentSubmission } from './dtos/assignment-response.dto';
import { GetAssignmentsArgs } from './dtos/get-assignments.args';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { CreateAssignmentSubmissionInput } from './dtos/create-assignment-submission.input';


@Resolver(() => Assignment)
export class AssignmentResolver {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Query(() => AssignmentsResponse)
  async getMyAssignments(
    @Args() args: GetAssignmentsArgs,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<AssignmentsResponse> {
    try {
      console.log('Getting assignments for student:', {
        studentId: currentUser.sub,
        tenantId: currentUser.tenantId,
        filters: args,
      });

      return await this.assignmentService.getStudentAssignments(currentUser, args);
    } catch (error) {
      console.error('Error in getMyAssignments resolver:', error);
      throw error;
    }
  }

  @Query(() => Assignment)
  async getAssignment(
    @Args('id', { type: () => ID }) id: string,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<Assignment> {
    try {
      console.log('Getting assignment:', {
        assignmentId: id,
        studentId: currentUser.sub,
        tenantId: currentUser.tenantId,
      });

      return await this.assignmentService.getAssignmentById(id, currentUser);
    } catch (error) {
      console.error('Error in getAssignment resolver:', error);
      throw error;
    }
  }

  @Mutation(() => AssignmentSubmission)
  async submitAssignment(
    @Args('input') input: CreateAssignmentSubmissionInput,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<AssignmentSubmission> {
    try {
      console.log('Submitting assignment:', {
        input,
        studentId: currentUser.sub,
        tenantId: currentUser.tenantId,
      });

      return await this.assignmentService.submitAssignment(input, currentUser);
    } catch (error) {
      console.error('Error in submitAssignment resolver:', error);
      throw error;
    }
  }
}