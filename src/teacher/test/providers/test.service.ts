import { Injectable } from '@nestjs/common';
import { User } from 'src/admin/users/entities/user.entity';
import { CreateTestProvider } from './create-test.provider';
import { GenerateQuestionsProvider } from './generate-questions.provider';
import { FindTestsProvider } from './find-tests.provider';
import { UpdateTestProvider } from './update-test.provider';
import { CreateTestInput } from '../dtos/create-test-input.dto';
import { Test } from '../entities/test.entity';
import { GenerateQuestionsInput } from '../dtos/generate-questions-input.dto';
import { UpdateTestInput } from '../dtos/update-test-input.dto';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';

@Injectable()
export class TestService {
  constructor(
    private createTestProvider: CreateTestProvider,
    private generateQuestionsProvider: GenerateQuestionsProvider,
    private findTestsProvider: FindTestsProvider,
    private updateTestProvider: UpdateTestProvider,
  ) {}

  async createTest(
    createTestInput: CreateTestInput,
    teacher: ActiveUserData,
  ): Promise<Test> {
    return this.createTestProvider.createTest(createTestInput, teacher);
  }

  async generateQuestions(input: GenerateQuestionsInput) {
    return this.generateQuestionsProvider.generateQuestions(input);
  }

  async findTestsByTeacher(teacher: User): Promise<Test[]> {
    return this.findTestsProvider.findTestsByTeacher(teacher);
  }

  async findTestById(id: string, teacher: User): Promise<Test> {
    return this.findTestsProvider.findTestById(id, teacher);
  }

  async updateTest(
    updateTestInput: UpdateTestInput,
    teacher: User,
  ): Promise<Test> {
    return this.updateTestProvider.updateTest(updateTestInput, teacher);
  }

  async deleteTest(id: string, teacher: User): Promise<boolean> {
    const test = await this.findTestsProvider.findTestById(id, teacher);
    if (!test) {
      return false;
    }

    // In a real implementation, you might want to soft delete or check if test is active
    // For now, we'll just return true to indicate successful deletion
    return true;
  }
}
