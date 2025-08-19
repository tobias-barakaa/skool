import { Resolver, Mutation, Query, Args, Context, GraphQLExecutionContext, GqlExecutionContext } from '@nestjs/graphql';
import { Test } from './entities/test.entity';
import { CreateTestInput } from './dtos/create-test-input.dto';
import { TestService } from './providers/test.service';
import { CreateQuestionInput } from './dtos/create-question-input.dto';
import { GenerateQuestionsInput } from './dtos/generate-questions-input.dto';
import { UpdateTestInput } from './dtos/update-test-input.dto';
import { GeneratedQuestionOutput } from './dtos/generated-question-output.dto';
import { mapToGeneratedQuestionOutput } from './utils/map-create-to-output';
import { ValidationPipe, UsePipes, BadRequestException } from '@nestjs/common';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { validate } from 'class-validator';


@Resolver(() => Test)
export class TestResolver {
  constructor(private testService: TestService) {}

  @Mutation(() => Test)
  async createTest(
    @Args('createTestInput') createTestInput: CreateTestInput,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<Test> {
    try {
      console.log('Received input:', JSON.stringify(createTestInput, null, 2));
      console.log('Current user:', currentUser);

      // Validate tenant access
      const tenantId = currentUser.tenantId;
      if (!tenantId) {
        throw new BadRequestException('Unauthorized: tenantId missing in token');
      }

      // Additional manual validation for better error reporting
      const validationErrors = await validate(createTestInput);
      if (validationErrors.length > 0) {
        const errorMessages = this.formatValidationErrors(validationErrors);
        console.error('Validation errors:', errorMessages);
        throw new BadRequestException({
          message: 'Input validation failed',
          errors: errorMessages,
        });
      }

      // Validate questions if present
      if (createTestInput.questions?.length) {
        for (let i = 0; i < createTestInput.questions.length; i++) {
          const question = createTestInput.questions[i];
          const questionErrors = await validate(question);

          if (questionErrors.length > 0) {
            const errorMessages = this.formatValidationErrors(questionErrors);
            console.error(`Question ${i + 1} validation errors:`, errorMessages);
            throw new BadRequestException({
              message: `Question ${i + 1} validation failed`,
              errors: errorMessages,
            });
          }

          // Validate options for multiple choice questions
          if (question.type === 'multiple_choice' && (!question.options || question.options.length === 0)) {
            throw new BadRequestException(`Multiple choice question ${i + 1} must have options`);
          }

          // Validate that at least one option is correct for multiple choice
          if (question.type === 'multiple_choice' && question.options) {
            const hasCorrectOption = question.options.some(option => option.isCorrect);
            if (!hasCorrectOption) {
              throw new BadRequestException(`Multiple choice question ${i + 1} must have at least one correct option`);
            }
          }
        }
      }

      return await this.testService.createTest(createTestInput, currentUser);
    } catch (error) {
      console.error('Error in createTest resolver:', error);

      // Re-throw validation and bad request errors as-is
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Wrap other errors
      throw new BadRequestException(
        error.message || 'An error occurred while creating the test'
      );
    }
  }

  private formatValidationErrors(errors: any[]): any[] {
    return errors.map(error => ({
      field: error.property,
      value: error.value,
      constraints: error.constraints,
      children: error.children?.length > 0 ? this.formatValidationErrors(error.children) : undefined,
    }));
  }


  @Mutation(() => [GeneratedQuestionOutput])
  async generateQuestions(
    @Args('generateQuestionsInput')
    generateQuestionsInput: GenerateQuestionsInput,
  ): Promise<GeneratedQuestionOutput[]> {
    const generated = await this.testService.generateQuestions(
      generateQuestionsInput,
    );
    return mapToGeneratedQuestionOutput(generated);
  }

  @Query(() => [Test])
  async myAssignMents(
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<Test[]> {
    try {
      const teacher = currentUser;
      return this.testService.findTestsByTeacher(teacher);
    } catch (error) {
      throw new BadRequestException('Failed to fetch tests');
    }
  }

  @Query(() => Test, { nullable: true })
  async testById(
    @Args('id') id: string,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<Test | null> {
    return this.testService.findTestById(id, currentUser);
  }

  @Mutation(() => Test)
  async updateTest(
    @Args('updateTestInput') updateTestInput: UpdateTestInput,
    @Context() context: any,
  ): Promise<Test> {
    const teacher = context.req.user;
    return this.testService.updateTest(updateTestInput, teacher);
  }

  @Mutation(() => Boolean)
  async deleteAssignment(
    @Args('id') id: string,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<boolean> {
    return this.testService.deleteTest(id, currentUser);
  }
}
