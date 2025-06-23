import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from '../entities/school.entity';
import { SchoolCreateProvider } from './school-create.provider';
import { Organization } from 'src/organizations/entities/organizations-entity';
import { ActiveUser } from 'src/auth/decorator/active-user.decorator';
import { ActiveUserData } from 'src/auth/interface/active-user.interface';

@Injectable()
export class SchoolService {
  private readonly logger = new Logger(SchoolService.name);


  constructor(
    @InjectRepository(School)
    private readonly schoolCreateProvider: SchoolCreateProvider,
  ) {}

  
  async createSchool(name: string): Promise<School> {
    // this.logger.log(`Creating new school: ${name}`);
    return this.schoolCreateProvider.createSchool(name);
    
  }

  async getOrganizationById(organizationId: string) {

    return this.schoolCreateProvider.getOrganizationById(organizationId);

  }

  async getStudentsByLevel(organizationId: string, level: string, grade: string) {
    // this.logger.log(`Fetching students for organization ${organizationId}, level ${level}, grade ${grade}`);
    return this.schoolCreateProvider.getStudentsByLevel(organizationId, level, grade);
  }


  async updateSchoolConfiguration(
    organizationId: string,
    schoolType: string,
    selectedLevels: string[]
  ) {
    // this.logger.log(`Updating school configuration for organization ${organizationId}`);
    return this.schoolCreateProvider.updateSchoolConfiguration(
      organizationId,
      schoolType,
      selectedLevels
    );
  }

  
}
