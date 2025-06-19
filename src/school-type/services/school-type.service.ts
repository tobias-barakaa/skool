import { Injectable } from '@nestjs/common';
import { CreateSchoolSetupDto } from '../dtos/create-school-setup.dto';
import { SubjectService } from './cbc.service';
import { AddCBCConfigInput } from '../dtos/add-config.input';

@Injectable()
export class SchoolTypeService {
  constructor(
    private readonly subjectService: SubjectService
  ) {}

  async addCBCConfiguration(input: AddCBCConfigInput, host: string, userId: string) {
    return this.subjectService.addCBCConfiguration(input, host, userId);
  }
}
