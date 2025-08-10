import { Injectable } from '@nestjs/common';
import { CreateAssessmentInput } from '../dto/create-assessment.input';
import { AssessmentCreateProvider } from './assessment.create.provider';
import { Assessment } from '../entity/assessment.entity';

@Injectable()
export class AssessmentService {
  constructor(private readonly createProvider: AssessmentCreateProvider) {}

  async create(
    input: CreateAssessmentInput,
    tenantId: string,
  ): Promise<Assessment> {
    return this.createProvider.createAssessment(input, tenantId);
  }
}
