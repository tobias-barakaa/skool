import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Test } from '../entities/test.entity';
import { User } from 'src/admin/users/entities/user.entity';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';

@Injectable()
export class FindTestsProvider {
  constructor(
    @InjectRepository(Test)
    private testRepository: Repository<Test>,
  ) {}

  async findTestsByTeacher(teacher: ActiveUserData): Promise<Test[]> {
    return this.testRepository.find({
      where: { teacher: { id: teacher.sub } },
      relations: [
        'questions',
        'questions.options',
        'referenceMaterials',
        'gradeLevels', // Add this
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findTestById(id: string, teacher: ActiveUserData): Promise<Test> {
    const test = await this.testRepository.findOne({
      where: { id, teacher: { id: teacher.sub } }, // Use teacher.sub like in myTests
      relations: [
        'questions',
        'questions.options',
        'referenceMaterials',
        'teacher',
        'gradeLevels',
      ],
      order: {
        questions: { order: 'ASC' },

      },
    });

    if (!test) {
      throw new NotFoundException(
        `Test with id ${id} not found or you don't have permission to access it`,
      );
    }

    if (test.questions) {
      test.questions = test.questions.map((question) => {
        if (question.options) {
          question.options = question.options.sort((a, b) => a.order - b.order);
        }
        return question;
      }).sort((a, b) => a.order - b.order);
    }

    return test;
  }
}
