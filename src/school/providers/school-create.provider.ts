// src/school/providers/school-create.provider.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from '../entities/school.entity';
import { SchoolAlreadyExistsException } from '../../common/exceptions/business.exception';

@Injectable()
export class SchoolCreateProvider {
  private readonly logger = new Logger(SchoolCreateProvider.name);

  constructor(
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
  ) {}

  private slugifySchoolName(schoolName: string): string {
    // Remove 'school' from the end if it exists (case insensitive)
    const cleanedName = schoolName.replace(/\bschool\b/gi, '').trim();
    // Convert to lowercase and replace spaces with hyphens
    return cleanedName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '');
  }

  async createSchool(schoolName: string): Promise<School> {
    const subdomain = this.slugifySchoolName(schoolName);

    // Check if school with subdomain already exists
    const existingSchool = await this.schoolRepository.findOne({
      where: { subdomain },
      select: ['schoolId', 'subdomain']
    });

    if (existingSchool) {
      this.logger.warn(`School creation failed: School with subdomain ${subdomain} already exists`);
      throw new SchoolAlreadyExistsException(subdomain);
    }

    try {
      const newSchool = this.schoolRepository.create({
        schoolName,
        subdomain,
        isActive: true,
      });

      const savedSchool = await this.schoolRepository.save(newSchool);
      this.logger.log(`School created successfully with ID: ${savedSchool.schoolId}`);
      return savedSchool;
    } catch (error) {
      this.logger.error(`Failed to create school: ${error.message}`, error.stack);
      throw error;
    }
  }
}