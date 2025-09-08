import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { FeeStructure } from './entities/fee-structure.entity';
import { FeeStructureItem } from '../fee-structure-item/entities/fee-structure-item.entity';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { CreateFeeStructureInput } from './dtos/create-fee-structure.input';

@Injectable()
export class FeeStructureService {
  constructor(
    @InjectRepository(FeeStructure)
    private readonly feeStructureRepository: Repository<FeeStructure>,
    @InjectRepository(FeeStructureItem)
    private readonly feeStructureItemRepository: Repository<FeeStructureItem>,
    private readonly dataSource: DataSource,
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

    return await this.dataSource.transaction(async manager => {
      const feeStructure = manager.create(FeeStructure, {
        ...input,
        tenantId: user.tenantId,
        items: undefined,
      });

      const savedStructure = await manager.save(feeStructure);

      const structureItems = input.items.map(item => 
        manager.create(FeeStructureItem, {
          ...item,
          tenantId: user.tenantId,
          feeStructureId: savedStructure.id,
        })
      );

      await manager.save(FeeStructureItem, structureItems);

      return await manager.findOne(FeeStructure, {
        where: { id: savedStructure.id },
        relations: ['items', 'items.feeBucket', 'academicYear', 'term', 'gradeLevel']
      });
    });
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