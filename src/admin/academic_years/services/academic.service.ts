import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcademicYear } from '../entities/academic_years.entity';
import { CreateAcademicYearInput } from '../dtos/create-academic-year.dto';

@Injectable()
export class AcademicYearService {
  constructor(
    @InjectRepository(AcademicYear)
    private readonly repo: Repository<AcademicYear>,
  ) {}

  async create(input: CreateAcademicYearInput, tenantId: string): Promise<AcademicYear> {
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);
    
    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    const existingYear = await this.repo.findOne({
      where: { tenantId, name: input.name }
    });

    if (existingYear) {
      throw new ConflictException(`Academic year with name '${input.name}' already exists`);
    }

    const overlappingYear = await this.repo
      .createQueryBuilder('year')
      .where('year.tenantId = :tenantId', { tenantId })
      .andWhere('year.isActive = true')
      .andWhere('(year.startDate <= :endDate AND year.endDate >= :startDate)', {
        startDate: input.startDate,
        endDate: input.endDate    
      })
      .getOne();

    if (overlappingYear) {
      throw new ConflictException(
        `Academic year dates overlap with existing year '${overlappingYear.name}'`
      );
    }

    const year = this.repo.create({ ...input, startDate, endDate, tenantId });
    return await this.repo.save(year);
  }

  async findAll(tenantId: string): Promise<AcademicYear[]> {
    return this.repo.find({
      where: { tenantId },
      relations: ['terms'],
      order: { startDate: 'DESC' }
    });
  }

  async findById(id: string, tenantId: string): Promise<AcademicYear> {
    const year = await this.repo.findOne({
      where: { id, tenantId },
      relations: ['terms']
    });

    if (!year) {
      throw new NotFoundException('Academic year not found');
    }

    return year;
  }
}