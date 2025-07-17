import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Test } from '../entities/test.entity';
import { FindTestQuery } from '../dtos/find-test-query';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';

@Injectable()
export class FindTestQueryProvider {
  constructor(
    @InjectRepository(Test)
    private readonly testRepo: Repository<Test>,
  ) {}

  async execute(query: FindTestQuery, teacher: ActiveUserData): Promise<Test> {
    const { testId } = query;
    const { sub: userId, tenantId } = teacher;

    const test = await this.testRepo
      .createQueryBuilder('test')
      .innerJoinAndSelect('test.teacher', 'teacher')
      .innerJoin('teacher.user', 'user')
      .innerJoin('user.tenant', 'tenant')
      .leftJoinAndSelect('test.gradeLevels', 'gradeLevels')
      .leftJoinAndSelect('test.questions', 'questions')
      .leftJoinAndSelect('questions.options', 'options')
      .leftJoinAndSelect('test.referenceMaterials', 'referenceMaterials')
      .where('test.id = :testId', { testId })
      .andWhere('user.id = :userId', { userId })
      .andWhere('tenant.id = :tenantId', { tenantId })
      .getOne();

    if (!test) {
      throw new BadRequestException(
        `Test "${testId}" not found or you do not have access.`,
      );
    }

    return test;
  }
}
