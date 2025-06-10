import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from '../entities/school.entity';

@Injectable()
export class SchoolService {
  private readonly logger = new Logger(SchoolService.name);

  constructor(
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
  ) {}

  async findSchoolByName(name: string): Promise<School | null> {
    this.logger.log(`Searching for school with name: ${name}`);
    
    return this.schoolRepository.findOne({
      where: { name: name.trim() },
    });
  }

  async createSchool(name: string, description?: string): Promise<School> {
    this.logger.log(`Creating new school: ${name}`);

    const school = this.schoolRepository.create({
      name: name.trim(),
    });

    const savedSchool = await this.schoolRepository.save(school);
    this.logger.log(`School created successfully with ID: ${savedSchool.id}`);
    
    return savedSchool;
  }

  
}
