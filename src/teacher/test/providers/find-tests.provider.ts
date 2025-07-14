import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Test } from '../entities/test.entity';
import { User } from 'src/admin/users/entities/user.entity';

@Injectable()
export class FindTestsProvider {
  constructor(
    @InjectRepository(Test)
    private testRepository: Repository<Test>,
  ) {}

  async findTestsByTeacher(teacher: User): Promise<Test[]> {
    return this.testRepository.find({
      where: { teacher: { id: teacher.id } },
      relations: ['questions', 'questions.options', 'referenceMaterials'],
      order: { createdAt: 'DESC' },
    });
  }

  async findTestById(id: string, teacher: User): Promise<Test> {
    const test = await this.testRepository.findOne({
      where: { id, teacher: { id: teacher.id } },
      relations: [
        'questions',
        'questions.options',
        'referenceMaterials',
        'teacher',
      ],
    });

    if (!test) {
      throw new Error(`Test with id ${id} not found`);
    }

    return test;
  }
}
