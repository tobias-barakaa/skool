import { Injectable, Logger, HttpStatus, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { School } from '../entities/school.entity';
import { BusinessException, SchoolAlreadyExistsException } from 'src/common/exceptions/business.exception';
import { Organization } from 'src/organizations/entities/organizations-entity';
import { Student } from 'src/student/entities/student.entity';
import { SCHOOL_TYPES_CONFIG } from '../config/school-type.config';

@Injectable()
export class SchoolCreateProvider {
  private readonly logger = new Logger(SchoolCreateProvider.name);

  constructor(
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,


    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>
  ) {}

  private slugifySchoolName(schoolName: string): string {
    // Remove 'school' from the end if it exists (case insensitive)
    const cleanedName = schoolName.replace(/\bschool\b/gi, '').trim();
    
    // Convert to lowercase and replace spaces with hyphens
    let slug = cleanedName
      .toLowerCase()
      .replace(/\s+/g, '-')           // Replace spaces with hyphens
      .replace(/[^\w-]+/g, '')        // Remove special characters except hyphens
      .replace(/--+/g, '-')           // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, '');       // Remove leading/trailing hyphens

    // Ensure slug is not empty and has minimum length
    if (!slug || slug.length < 2) {
      slug = `school-${Date.now()}`;
    }

    return slug;
  }

  private async generateUniqueSubdomain(baseSubdomain: string): Promise<string> {
    let subdomain = baseSubdomain;
    let counter = 1;

    while (true) {
      const existingSchool = await this.schoolRepository.findOne({
        where: { subdomain },
        select: ['schoolId', 'subdomain']
      });

      if (!existingSchool) {
        return subdomain;
      }

      subdomain = `${baseSubdomain}-${counter}`;
      counter++;

      // Prevent infinite loop - limit to 100 attempts
      if (counter > 100) {
        throw new BusinessException(
          'Unable to generate unique subdomain',
          'SUBDOMAIN_GENERATION_FAILED',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }

  async createSchool(schoolName: string): Promise<School> {
    this.logger.log(`Attempting to create school: ${schoolName}`);

    try {
      const baseSubdomain = this.slugifySchoolName(schoolName);
      const uniqueSubdomain = await this.generateUniqueSubdomain(baseSubdomain);

      const newSchool = this.schoolRepository.create({

        schoolName: schoolName.trim(),
        subdomain: uniqueSubdomain,
        isActive: true,
      });

      const savedSchool = await this.schoolRepository.save(newSchool);
      this.logger.log(`School created successfully with ID: ${savedSchool.schoolId} and subdomain: ${uniqueSubdomain}`);
      console.log(`School created successfully: ${savedSchool.schoolName} with subdomain: ${savedSchool.subdomain}`);
      
      return savedSchool;
    } catch (error) {
      this.logger.error(`Failed to create school: ${error.message}`, error.stack);
      
      // Re-throw business exceptions as-is
      if (error instanceof BusinessException) {
        throw error;
      }
      
      // Handle database constraint violations
      if (error instanceof QueryFailedError) {
        if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
          // If it's a subdomain constraint, we shouldn't reach here due to our uniqueness check
          // but handle it just in case
          throw new SchoolAlreadyExistsException(this.slugifySchoolName(schoolName));
        }
      }
      
      // Wrap other errors in a generic business exception
      throw new BusinessException(
        'Failed to create school',
        'SCHOOL_CREATION_FAILED',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { originalError: error.message, schoolName }
      );
    }
  }



  async getOrganizationById(id: string) {
    return this.organizationRepository.findOne({
      where: { id },
      relations: ['users', 'students', 'teachers']
    });
  }

  async updateSchoolConfiguration(
    organizationId: string,
    schoolType: string,
    selectedLevels: string[]
  ){
    const config = SCHOOL_TYPES_CONFIG[schoolType];
    const schoolConfig = {
      type: schoolType,
      selectedLevels,
      menuItems: config.menuItems,
      levels: selectedLevels.reduce((acc, level) => {
        acc[level] = config.levels[level];
        return acc;
      }, {})
    };

    await this.organizationRepository.update(organizationId, {
      schoolType,
      schoolConfig: schoolConfig as any
    });

    return this.getOrganizationById(organizationId);
  }

  async getStudentsByLevel(
    organizationId: string,
    academicLevel: string,
    gradeLevel: string
  ): Promise<Student[]> {
    return this.studentRepository.find({
      where: {
        organizationId,
        academicLevel,
        gradeLevel
      },
      relations: ['organization']
    });
  }


}