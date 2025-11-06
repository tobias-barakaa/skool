import { Injectable } from '@nestjs/common';
import { CreateAssessmentInput } from '../dto/create-assessment.input';
import { AssessmentCreateProvider } from './assessment.create.provider';
import { Assessment } from '../entity/assessment.entity';
import { AssessmentFilterInput } from '../dto/assessment-filter.input';
import { AssessmentReadProvider } from './assessment-read.provider';
import { AssessType } from '../enums/assesment-type.enum';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';

@Injectable()
export class AssessmentService {
  constructor(
    private readonly createProvider: AssessmentCreateProvider,
    private readonly assessmentReadProvider:AssessmentReadProvider,
  ) {}

  async create(
    input: CreateAssessmentInput,
    tenantId: string,
  ): Promise<Assessment> {
    return this.createProvider.createAssessment(input, tenantId);
  }

  async getAllAssessments(
    user:ActiveUserData,
    filter?: AssessmentFilterInput,
  ): Promise<Assessment[]> {
    return this.assessmentReadProvider.getAll(user, filter);
  }

  async deleteCA(id: string, user: ActiveUserData): Promise<boolean> {
    return this.assessmentReadProvider.deleteAssessment(id, user, AssessType.CA);
  }

  async deleteExam(id: string, user: ActiveUserData): Promise<boolean> {
    return this.assessmentReadProvider.deleteAssessment(id, user, AssessType.EXAM);
  }

}
