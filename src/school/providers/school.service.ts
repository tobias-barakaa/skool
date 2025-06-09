// src/school/school.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSchoolInput } from '../dtos/create-school.input';
import { School } from '../entities/school.entity';

@Injectable()
export class SchoolService {
  constructor(
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
  ) {}

  async create(createSchoolInput: CreateSchoolInput): Promise<School> {
    if (createSchoolInput.subdomain) {
      const existingSchool = await this.schoolRepository.findOne({
        where: { subdomain: createSchoolInput.subdomain },
      });
      if (existingSchool) {
        throw new ConflictException(`Subdomain '${createSchoolInput.subdomain}' is already taken.`);
      }
    }

    const school = this.schoolRepository.create({
      ...createSchoolInput,
      // Ensure termDates is stored as stringified JSON if it's an array
    });
    return this.schoolRepository.save(school);
  }

  async findOne(id: string): Promise<School> {
    const school = await this.schoolRepository.findOne({ where: { id } });
    if (!school) {
      throw new NotFoundException(`School with ID "${id}" not found.`);
    }
    // Parse termDates back to array of strings when fetching
    if (school.termDates && typeof school.termDates === 'string') {
        school.termDates = JSON.parse(school.termDates as any);
    }
    return school;
  }

  async findBySubdomain(subdomain: string): Promise<School> {
    const school = await this.schoolRepository.findOne({ where: { subdomain } });
    if (!school) {
      throw new NotFoundException(`School with subdomain "${subdomain}" not found.`);
    }
    if (school.termDates && typeof school.termDates === 'string') {
        school.termDates = JSON.parse(school.termDates as any);
    }
    return school;
  }

  
}