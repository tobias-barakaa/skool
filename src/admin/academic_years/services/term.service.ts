import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Term } from '../entities/terms.entity';
import { AcademicYear } from '../entities/academic_years.entity';
import { CreateTermInput } from '../dtos/create-term-input.dto';

@Injectable()
export class TermService {
  constructor(
    @InjectRepository(Term)
    private readonly termRepo: Repository<Term>,
    @InjectRepository(AcademicYear)
    private readonly academicYearRepo: Repository<AcademicYear>,
  ) {}

  async create(input: CreateTermInput, tenantId: string): Promise<Term> {
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);
    
    if (startDate >= endDate) {
      throw new BadRequestException('Term start date must be before end date');
    }

    const academicYear = await this.academicYearRepo.findOne({
      where: { id: input.academicYearId, tenantId }
    });

    if (!academicYear) {
      throw new NotFoundException(`Academic year with ID "${input.academicYearId}" not found for this tenant`);
    }

    const academicStartDate = new Date(academicYear.startDate);
    const academicEndDate = new Date(academicYear.endDate);

    if (startDate < academicStartDate || endDate > academicEndDate) {
      throw new BadRequestException(
        `Term dates must be within academic year period (${academicStartDate.toISOString().split('T')[0]} to ${academicEndDate.toISOString().split('T')[0]})`
      );
    }

    const existingTerm = await this.termRepo.findOne({
      where: { 
        tenantId, 
        academicYearId: input.academicYearId, 
        name: input.name 
      }
    });

    if (existingTerm) {
      throw new ConflictException(
        `Term with name '${input.name}' already exists in this academic year`
      );
    }

    const overlappingTerm = await this.termRepo
      .createQueryBuilder('term')
      .where('term.tenantId = :tenantId', { tenantId })
      .andWhere('term.academicYearId = :academicYearId', { academicYearId: input.academicYearId })
      .andWhere('term.isActive = true')
      .andWhere('(term.startDate <= :endDate AND term.endDate >= :startDate)', {
        startDate: input.startDate,
        endDate: input.endDate     
      })
      .getOne();

    if (overlappingTerm) {
      throw new ConflictException(
        `Term dates overlap with existing term '${overlappingTerm.name}'`
      );
    }

    const term = this.termRepo.create({ 
      ...input, 
      startDate, 
      endDate,   
      tenantId,
      academicYearId: input.academicYearId
    });
    
    await this.termRepo.save(term);
    
    const savedTerm = await this.termRepo.findOne({
        where: { id: term.id },
        relations: ['academicYear'],
      });
      
      if (!savedTerm) {
        throw new NotFoundException(`Failed to retrieve created term with id ${term.id}`);
      }
      
      return savedTerm;
  }

 
  async findAllByAcademicYear(academicYearId: string, tenantId: string): Promise<Term[]> {
    return this.termRepo.find({
      where: { academicYearId, tenantId },
      relations: ['academicYear'],
      order: { startDate: 'ASC' },
    });
  }

  
  async findOne(id: string, tenantId: string): Promise<Term> {
    const term = await this.termRepo.findOne({
      where: { id, tenantId },
      relations: ['academicYear'],
    });

    if (!term) {
      throw new NotFoundException(`Term with ID "${id}" not found for this tenant`);
    }
    return term;

}
  

  async findAll(tenantId: string): Promise<Term[]> {
    return this.termRepo.find({
      where: { tenantId },
      relations: ['academicYear'],
      order: { startDate: 'ASC' }
    });
  }

  async findByAcademicYear(academicYearId: string, tenantId: string): Promise<Term[]> {
    return this.termRepo.find({
      where: { academicYearId, tenantId },
      relations: ['academicYear'],
      order: { startDate: 'ASC' }
    });
  }
}