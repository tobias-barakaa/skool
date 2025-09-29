import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Term } from '../entities/terms.entity';
import { AcademicYear } from '../entities/academic_years.entity';
import { CreateTermInput } from '../dtos/create-term-input.dto';
import { UpdateTermInput } from '../dtos/update-term.input.dto';

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



  async findAllTerms(tenantId: string): Promise<Term[]> {
    return this.termRepo.find({
      where: { tenantId },
      relations: ['academicYear'],
      order: { startDate: 'ASC' },
    });
  }

  async update(id: string, input: UpdateTermInput, tenantId: string): Promise<Term> {
    const term = await this.findById(id, tenantId);
  
    const startDate = input.startDate ? new Date(input.startDate) : term.startDate;
    const endDate   = input.endDate   ? new Date(input.endDate)   : term.endDate;
  
    if (startDate >= endDate) {
      throw new BadRequestException('End date must be after start date');
    }
  
    const year = await this.academicYearRepo.findOneByOrFail({ id: term.academicYearId, tenantId });
    if (startDate < year.startDate || endDate > year.endDate) {
      throw new BadRequestException('Term dates must be within academic year');
    }
  
    if (input.name && input.name !== term.name) {
      const dup = await this.termRepo.findOneBy({ tenantId, academicYearId: term.academicYearId, name: input.name });
      if (dup) throw new ConflictException(`Term name '${input.name}' already exists`);
    }
  
    const overlap = await this.termRepo
      .createQueryBuilder('t')
      .where('t.tenantId = :tenantId', { tenantId })
      .andWhere('t.academicYearId = :academicYearId', { academicYearId: term.academicYearId })
      .andWhere('t.id != :id', { id })
      .andWhere('t.isActive = true')
      .andWhere('(t.startDate <= :end AND t.endDate >= :start)', { start: endDate, end: startDate })
      .getOne();
    if (overlap) throw new ConflictException(`Dates overlap with term '${overlap.name}'`);
  
    if (input.name)      term.name      = input.name;
    if (input.startDate) term.startDate = startDate;
    if (input.endDate)   term.endDate   = endDate;
    if (input.isActive !== undefined) term.isActive = input.isActive;
    if (input.isCurrent !== undefined) term.isCurrent = input.isCurrent;
  
    return this.termRepo.save(term);
  }


async remove(id: string, tenantId: string): Promise<boolean> {
  const term = await this.findById(id, tenantId);
  await this.termRepo.remove(term);
  return true;
}

async setCurrent(id: string, tenantId: string): Promise<Term> {
  const term = await this.findById(id, tenantId);

  await this.termRepo.manager.transaction(async (em) => {
    await em.update(Term, { academicYearId: term.academicYearId, isCurrent: true }, { isCurrent: false });
    term.isCurrent = true;
    await em.save(term);
  });
  return term;
}


async findById(id: string, tenantId: string): Promise<Term> {
  const term = await this.termRepo.findOne({
    where: { id, tenantId },
    relations: ['academicYear'],
  });
  if (!term) throw new NotFoundException('Term not found');
  return term;
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