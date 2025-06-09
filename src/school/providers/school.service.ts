import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from './entities/school.entity';
import { UpdateSchoolInput } from './dto/update-school.input';

@Injectable()
export class SchoolsService {
  constructor(
    @InjectRepository(School)
    private schoolsRepository: Repository<School>,
  ) {}

  async findById(id: string): Promise<School> {
    const school = await this.schoolsRepository.findOne({
      where: { id },
      relations: ['users', 'colorPalette'],
    });
    
    if (!school) {
      throw new NotFoundException('School not found');
    }
    
    return school;
  }

  async update(id: string, updateSchoolInput: UpdateSchoolInput): Promise<School> {
    const school = await this.findById(id);
    
    Object.assign(school, updateSchoolInput);
    
    return this.schoolsRepository.save(school);
  }

  async findBySubdomain(subdomain: string): Promise<School> {
    const school = await this.schoolsRepository.findOne({
      where: { subdomain },
      relations: ['colorPalette'],
    });
    
    if (!school) {
      throw new NotFoundException('School not found');
    }
    
    return school;
  }
}