import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { FeeStructure } from './entities/fee-structure.entity';
import { FeeStructureItem } from '../fee-structure-item/entities/fee-structure-item.entity';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { CreateFeeStructureInput } from './dtos/create-fee-structure.input';
import { FeeBucket } from '../fee-bucket/entities/fee-bucket.entity';
import { AcademicYear } from 'src/admin/academic_years/entities/academic_years.entity';
import { Term } from 'src/admin/academic_years/entities/terms.entity';
import { GradeLevel } from 'src/admin/level/entities/grade-level.entity';
import { TenantGradeLevel } from 'src/admin/school-type/entities/tenant-grade-level';

@Injectable()
export class FeeStructureService {
  constructor(
    @InjectRepository(FeeStructure)
    private readonly feeStructureRepository: Repository<FeeStructure>,
    @InjectRepository(FeeStructureItem)
    private readonly feeStructureItemRepository: Repository<FeeStructureItem>,
    private readonly dataSource: DataSource,
    @InjectRepository(FeeBucket)
    private readonly feeBucketRepository: Repository<FeeBucket>,
    // @InjectRepository(AcademicYear)
    // private readonly academicYearRepository: Repository<AcademicYear>,
    // @InjectRepository(Term)
    // private readonly termRepository: Repository<Term>,
    // @InjectRepository(TenantGradeLevel)
    // private readonly tenantGradeLevelRepository: Repository<TenantGradeLevel>


  ) {}

  async create(input: CreateFeeStructureInput, user: ActiveUserData) {
    const existingStructure = await this.feeStructureRepository.findOne({
      where: {
        tenantId: user.tenantId,
        academicYearId: input.academicYearId,
        termId: input.termId,
        gradeLevelId: input.gradeLevelId,
      }
    });
  
    if (existingStructure) {
      throw new ConflictException('Fee structure already exists for this combination');
    }
  
    await this.validateCoreEntities(input, user.tenantId);
  
    return await this.dataSource.transaction(async manager => {
      const feeStructure = manager.create(FeeStructure, {
        ...input,
        tenantId: user.tenantId,
      });
  
      const savedStructure = await manager.save(feeStructure);
  
      return await manager.findOne(FeeStructure, {
        where: { id: savedStructure.id },
        relations: ['academicYear', 'term', 'gradeLevel']
      });
    });
  }
  
  private async validateCoreEntities(
    input: CreateFeeStructureInput,
    tenantId: string,
  ): Promise<void> {
    const validationPromises: Promise<void>[] = [];
  
    const academicYearRepository = this.dataSource.getRepository(AcademicYear)
    validationPromises.push(
      academicYearRepository.findOne({
        where: { id: input.academicYearId, tenantId },
        select: ['id']
      }).then(result => {
        if (!result) {
          throw new BadRequestException(`Academic year with ID ${input.academicYearId} not found or doesn't belong to your organization`);
        }
      })
    );
  
    const termRepository = this.dataSource.getRepository(Term)
    validationPromises.push(
      termRepository.findOne({
        where: { id: input.termId, tenantId },
        select: ['id']
      }).then(result => {
        if (!result) {
          throw new BadRequestException(`Term with ID ${input.termId} not found or doesn't belong to your organization`);
        }
      })
    );

  
    const tenantGradeLevelRepository = this.dataSource.getRepository(TenantGradeLevel);

validationPromises.push(
  tenantGradeLevelRepository
    .findOne({
      where: {
        tenant: { id: tenantId },
        gradeLevel: { id: input.gradeLevelId },
      },
      select: ['id'],
    })
    .then((row) => {
      if (!row) {
        throw new BadRequestException(
          `Grade level ${input.gradeLevelId} is not enabled for your organisation`,
        );
      }
    })
);
  
    await Promise.all(validationPromises);
  }

  async findAll(user: ActiveUserData): Promise<FeeStructure[]> {
    return await this.feeStructureRepository.find({
      where: { tenantId: user.tenantId, isActive: true },
      relations: ['items', 'items.feeBucket', 'academicYear', 'term', 'gradeLevel'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string, user: ActiveUserData): Promise<FeeStructure> {
    const feeStructure = await this.feeStructureRepository.findOne({
      where: { id, tenantId: user.tenantId },
      relations: ['items', 'items.feeBucket', 'academicYear', 'term', 'gradeLevel']
    });

    if (!feeStructure) {
      throw new NotFoundException('Fee structure not found');
    }

    return feeStructure;
  }

  async findByGradeAndTerm(gradeLevelId: string, termId: string, academicYearId: string, user: ActiveUserData): Promise<FeeStructure | null> {
    return await this.feeStructureRepository.findOne({
      where: {
        tenantId: user.tenantId,
        gradeLevelId,
        termId,
        academicYearId,
        isActive: true
      },
      relations: ['items', 'items.feeBucket']
    });
  }
}


