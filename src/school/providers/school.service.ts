import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from '../entities/school.entity';
import { SchoolCreateProvider } from './school-create.provider';

@Injectable()
export class SchoolService {
  private readonly logger = new Logger(SchoolService.name);


  constructor(
    @InjectRepository(School)
    private readonly schoolCreateProvider: SchoolCreateProvider,
  ) {}

  
  async createSchool(name: string): Promise<School> {
    this.logger.log(`Creating new school: ${name}`);
    return this.schoolCreateProvider.createSchool(name);
    
  }

  
}
