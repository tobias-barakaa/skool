import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { School } from '../entities/school.entity';
import { SchoolAlreadyExistsException, DatabaseException, ValidationException, BusinessException } from '../../common/exceptions/business.exception';

@Injectable()
export class SchoolCreateProvider {
  private readonly logger = new Logger(SchoolCreateProvider.name);

  constructor(
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
  ) {}

  private slugifySchoolName(schoolName: string): string {
    if (!schoolName?.trim()) {
      throw new ValidationException('School name cannot be empty');
    }

    // Remove 'school' from the end if it exists (case insensitive)
    const cleanedName = schoolName.replace(/\bschool\b/gi, '').trim();
    
    if (!cleanedName) {
      throw new ValidationException('School name must contain more than just "school"');
    }

    // Convert to lowercase and replace spaces with hyphens
    const subdomain = cleanedName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '');

    if (subdomain.length < 2) {
      throw new ValidationException('School name too short to generate valid subdomain');
    }

    return subdomain;
  }

  async createSchool(schoolName: string): Promise<School> {
    try {
      const subdomain = this.slugifySchoolName(schoolName);

      // Check if school already exists
      await this.checkSchoolExists(subdomain);

      // Create and save school
      const school = await this.saveSchool({
        schoolName: schoolName.trim(),
        subdomain,
        isActive: true,
      });

      this.logger.log(`School created successfully with ID: ${school.schoolId}`);
      return school;

    } catch (error) {
      this.logger.error(`Failed to create school: ${error.message}`, error.stack);
      
      if (error instanceof BusinessException) {
        throw error;
      }

      if (error instanceof QueryFailedError) {
        throw new DatabaseException(error.message, error);
      }

      throw new DatabaseException(
        `Unexpected error during school creation: ${error.message}`,
        error
      );
    }
  }

  private async checkSchoolExists(subdomain: string): Promise<void> {
    const existingSchool = await this.schoolRepository.findOne({
      where: { subdomain },
      select: ['schoolId', 'subdomain']
    });

    if (existingSchool) {
      this.logger.warn(`School creation failed: School with subdomain ${subdomain} already exists`);
      throw new SchoolAlreadyExistsException(subdomain);
    }
  }

  private async saveSchool(schoolData: Partial<School>): Promise<School> {
    try {
      const newSchool = this.schoolRepository.create(schoolData);
      return await this.schoolRepository.save(newSchool);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        if (error.message.includes('duplicate key')) {
          throw new SchoolAlreadyExistsException(schoolData.subdomain!);
        }
      }
      throw error;
    }
  }
}