import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcademicYear } from '../entities/academic_years.entity';
import { CreateAcademicYearInput } from '../dtos/create-academic-year.dto';
import { UpdateAcademicYearInput } from '../dtos/update-academic-year.dto';
import { Term } from '../entities/terms.entity';

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



  // academic-year.service.ts
async update(
  id: string,
  input: UpdateAcademicYearInput,
  tenantId: string,
): Promise<AcademicYear> {
  const year = await this.findById(id, tenantId); // 404 if not found

  /* ---------- name uniqueness ---------- */
  if (input.name && input.name !== year.name) {
    const duplicate = await this.repo.findOne({
      where: { tenantId, name: input.name },
    });
    if (duplicate)
      throw new ConflictException(`Name '${input.name}' already in use`);
  }

  /* ---------- date handling ---------- */
  const startDate = input.startDate ? new Date(input.startDate) : year.startDate;
  const endDate   = input.endDate   ? new Date(input.endDate)   : year.endDate;

  if (startDate >= endDate)
    throw new BadRequestException('End date must be after start date');

  /* ---------- overlap check (ignore self) ---------- */
  const overlap = await this.repo
    .createQueryBuilder('y')
    .where('y.tenantId = :tenantId', { tenantId })
    .andWhere('y.id != :id', { id })
    .andWhere('y.isActive = true')
    .andWhere('(y.startDate <= :end AND y.endDate >= :start)', {
      start: startDate,
      end:   endDate,
    })
    .getOne();

  if (overlap)
    throw new ConflictException(`Dates overlap with '${overlap.name}'`);

  if (input.name)      year.name      = input.name;
  if (input.startDate) year.startDate = startDate;
  if (input.endDate)   year.endDate   = endDate;
  if (input.isActive !== undefined) year.isActive = input.isActive;
  if (input.isCurrent !== undefined) year.isCurrent = input.isCurrent;

  return this.repo.save(year);
}
  
async remove(id: string, tenantId: string): Promise<boolean> {
  return this.repo.manager.transaction(async (em) => {
    const year = await em.findOne(AcademicYear, {
      where: { id, tenantId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!year) throw new NotFoundException('Academic year not found');

    await em.delete(Term, { academicYearId: id, tenantId });

    await em.remove(year);

    return true;
  });
}
  
  async setCurrent(id: string, tenantId: string): Promise<AcademicYear> {
    const year = await this.findById(id, tenantId);
  
    await this.repo.manager.transaction(async em => {
      await em.update(AcademicYear, { tenantId, isCurrent: true }, { isCurrent: false });
      year.isCurrent = true;
      await em.save(year);
    });
  
    return year;
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



