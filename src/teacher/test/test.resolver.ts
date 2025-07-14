import { Resolver, Mutation, Query, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Test } from './entities/test.entity';
import { CreateTestInput } from './dtos/create-test-input.dto';
import { TestService } from './providers/test.service';
import { CreateQuestionInput } from './dtos/create-question-input.dto';
import { GenerateQuestionsInput } from './dtos/generate-questions-input.dto';
import { UpdateTestInput } from './dtos/update-test-input.dto';
// Import your auth guard
// import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Resolver(() => Test)
// @UseGuards(JwtAuthGuard) // Uncomment when you have your auth guard
export class TestResolver {
  constructor(private testService: TestService) {}

  @Mutation(() => Test)
  async createTest(
    @Args('createTestInput') createTestInput: CreateTestInput,
    @Context() context: any, // Replace with your context type
  ): Promise<Test> {
    // Extract teacher from context after authentication
    const teacher = context.req.user; // Adjust based on your auth implementation
    return this.testService.createTest(createTestInput, teacher);
  }

  @Mutation(() => [CreateQuestionInput])
  async generateQuestions(
    @Args('generateQuestionsInput')
    generateQuestionsInput: GenerateQuestionsInput,
  ): Promise<CreateQuestionInput[]> {
    return this.testService.generateQuestions(generateQuestionsInput);
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
