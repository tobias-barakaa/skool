import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Test } from '../entities/test.entity';
import { User } from 'src/admin/users/entities/user.entity';
import { UpdateTestInput } from '../dtos/update-test-input.dto';

@Injectable()
export class UpdateTestProvider {
  constructor(
    @InjectRepository(Test)
    private testRepository: Repository<Test>,
  ) {}

  async updateTest(
    updateTestInput: UpdateTestInput,
    teacher: User,
  ): Promise<Test> {
    const test = await this.testRepository.findOne({
      where: { id: updateTestInput.id, teacher: { id: teacher.id } },
    });

    if (!test) {
      throw new NotFoundException('Test not found');
    }

    try {
      const updatedTest = await this.testRepository.save({
        ...test,
        ...updateTestInput,
        date: updateTestInput.date ? new Date(updateTestInput.date) : test.date,
      });

      const foundTest = await this.testRepository.findOne({
        where: { id: updatedTest.id },
        relations: [
          'questions',
          'questions.options',
          'referenceMaterials',
          'teacher',
        ],
      });

      if (!foundTest) {
        throw new NotFoundException('Updated test not found');
      }

      return foundTest;
    } catch (error) {
      throw new BadRequestException(`Failed to update test: ${error.message}`);
    }
  }
}
