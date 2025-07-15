import { Resolver, Mutation, Query, Args, Context, GraphQLExecutionContext, GqlExecutionContext } from '@nestjs/graphql';
import { Test } from './entities/test.entity';
import { CreateTestInput } from './dtos/create-test-input.dto';
import { TestService } from './providers/test.service';
import { CreateQuestionInput } from './dtos/create-question-input.dto';
import { GenerateQuestionsInput } from './dtos/generate-questions-input.dto';
import { UpdateTestInput } from './dtos/update-test-input.dto';
import { GeneratedQuestionOutput } from './dtos/generated-question-output.dto';
import { mapToGeneratedQuestionOutput } from './utils/map-create-to-output';
import { ValidationPipe, UsePipes } from '@nestjs/common';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';


@Resolver(() => Test)
export class TestResolver {
  constructor(private testService: TestService) {}

  @Mutation(() => Test)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        console.error('Validation errors:', JSON.stringify(errors, null, 2));
        return errors;
      },
    }),
  )
  @Mutation(() => Test)
  async createTest(
    @Args('createTestInput') createTestInput: CreateTestInput,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<Test> {
    try {
      console.log('Received input:', JSON.stringify(createTestInput, null, 2));
      console.log('Current user:', currentUser);

      // Optionally validate tenant access here
      const tenantId = currentUser.tenantId;
      if (!tenantId) {
        throw new Error('Unauthorized: tenantId missing in token');
      }

      return await this.testService.createTest(createTestInput, currentUser);
    } catch (error) {
      console.error('Error in createTest resolver:', error);
      throw error;
    }
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
  async myTests(@Context() context: any): Promise<Test[]> {
    const teacher = context.req.user;
    return this.testService.findTestsByTeacher(teacher);
  }

  @Query(() => Test, { nullable: true })
  async testById(
    @Args('id') id: string,
    @Context() context: any,
  ): Promise<Test | null> {
    const teacher = context.req.user;
    return this.testService.findTestById(id, teacher);
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
  async deleteTest(
    @Args('id') id: string,
    @Context() context: any,
  ): Promise<boolean> {
    const teacher = context.req.user;
    return this.testService.deleteTest(id, teacher);
  }
}
