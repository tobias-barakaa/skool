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
import { UpdateFeeStructureInput } from './dtos/update-fee-structure.input.dto';

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
        tenantGradeLevelId: input.tenantGradeLevelId,
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
        relations: ['academicYear', 'term', 'tenantGradeLevel', 'tenantGradeLevel.gradeLevel']
      });
    });
  }
  
  private async validateCoreEntities<T extends Partial<CreateFeeStructureInput>>(
    input: T,
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
        id: input.tenantGradeLevelId,
        tenant: { id: tenantId },
        isActive: true

      },
      relations: ['gradeLevel'],
    })
    .then((row) => {
      if (!row) {
        throw new BadRequestException(
          `Grade level ${input.tenantGradeLevelId} is not enabled for your organisation`,
        );
      }
    })
);

  
    await Promise.all(validationPromises);
  }

  async findAll(user: ActiveUserData): Promise<FeeStructure[]> {
    return this.feeStructureRepository.find({
      where: { tenantId: user.tenantId, isActive: true },
      relations: [
        'academicYear',
        'term',
        'tenantGradeLevel',
        'tenantGradeLevel.gradeLevel',
        'items',
        'items.feeBucket',
      ],
      order: { createdAt: 'DESC' },
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

  async findByGradeAndTerm(
    tenantGradeLevelId: string,
    termId: string,
    academicYearId: string,
    user: ActiveUserData,
  ): Promise<FeeStructure | null> {
    return this.feeStructureRepository.findOne({
      where: {
        tenantId: user.tenantId,
        tenantGradeLevelId,
        termId,
        academicYearId,
        isActive: true,
      },
      relations: [
        'academicYear',
        'term',
        'tenantGradeLevel',
        'tenantGradeLevel.gradeLevel',
        'items',
        'items.feeBucket',
      ],
    });
  }




  async findOneById(id: string, user: ActiveUserData): Promise<FeeStructure> {
    const fs = await this.feeStructureRepository.findOne({
      where: { id, tenantId: user.tenantId },
      relations: [
        'academicYear',
        'term',
        'tenantGradeLevel',
        'tenantGradeLevel.gradeLevel',
        'items',
        'items.feeBucket',
      ],
    });
    if (!fs) throw new NotFoundException('Fee structure not found');
    return fs;
  }
  
  async remove(id: string, user: ActiveUserData): Promise<boolean> {
    const fs = await this.findOneById(id, user);        
    await this.feeStructureRepository.remove(fs);       
    return true;
  }
  
  async update(
    id: string,
    input: UpdateFeeStructureInput,
    user: ActiveUserData,
  ): Promise<FeeStructure> {
    await this.findOneById(id, user);
    await this.validateCoreEntities(input, user.tenantId);
  
    return this.dataSource.transaction(async (mgr) => {
      const updateData: Partial<FeeStructure> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.isActive !== undefined) updateData.isActive = input.isActive;
      if (input.academicYearId !== undefined) updateData.academicYearId = input.academicYearId;
      if (input.termId !== undefined) updateData.termId = input.termId;
      if (input.tenantGradeLevelId !== undefined) updateData.tenantGradeLevelId = input.tenantGradeLevelId;
  
      await mgr.update(FeeStructure, id, updateData);
  
      const feeStructure = await mgr.findOne(FeeStructure, {
        where: { id },
        relations: [
          'academicYear',
          'term',
          'tenantGradeLevel',
          'tenantGradeLevel.gradeLevel',
        ],
      });
  
      if (!feeStructure) throw new Error('Fee structure not found');
      return feeStructure;
    });
  }
  




}

