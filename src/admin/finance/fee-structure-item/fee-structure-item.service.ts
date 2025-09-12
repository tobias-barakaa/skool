import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeeStructureItem } from './entities/fee-structure-item.entity';
import { FeeStructure } from '../fee-structure/entities/fee-structure.entity';
import { FeeBucket } from '../fee-bucket/entities/fee-bucket.entity';
import { CreateFeeStructureItemInput } from './dtos/create-fee-structure-item.dto';
import { UpdateFeeStructureItemInput } from './dtos/update-fee-structure-item.dto';

@Injectable()
export class FeeStructureItemService {
  constructor(
    @InjectRepository(FeeStructureItem)
    private feeStructureItemRepository: Repository<FeeStructureItem>,
    @InjectRepository(FeeStructure)
    private feeStructureRepository: Repository<FeeStructure>,
    @InjectRepository(FeeBucket)
    private feeBucketRepository: Repository<FeeBucket>,
  ) {}

  // async create(tenantId: string, input: CreateFeeStructureItemInput): Promise<FeeStructureItem> {
  //   const { feeStructureId, feeBucketId, amount, isMandatory = true } = input;

  //   if (amount < 0) throw new BadRequestException('Amount must be ≥ 0');

  //   const structure = await this.structureRepo.findOneBy({ id: feeStructureId, tenantId });
  //   if (!structure) throw new NotFoundException('Fee structure not found');

  //   const bucket = await this.bucketRepo.findOneBy({ id: feeBucketId, tenantId, isActive: true });
  //   if (!bucket) throw new NotFoundException('Fee bucket not found or inactive');

  //   const duplicate = await this.repo.findOneBy({ feeStructureId, feeBucketId, tenantId });
  //   if (duplicate) throw new ConflictException('This bucket is already assigned to the structure');

  //   const item = this.repo.create({ tenantId, feeStructureId, feeBucketId, amount, isMandatory });
  //   await this.repo.save(item);

  //   return this.repo.findOneOrFail({
  //     where: { id: item.id },
  //     relations: [
  //       'feeBucket',
  //       'feeStructure',
  //       'feeStructure.academicYear',
  //       'feeStructure.term',
  //       'feeStructure.tenantGradeLevel',
  //       'feeStructure.tenantGradeLevel.gradeLevel',
  //     ],
  //   });
  // }
  

  // async findAll(tenantId: string): Promise<FeeStructureItem[]> {
  //   return this.feeStructureItemRepository.find({
  //     where: { tenantId },
  //     relations: [
  //       'feeBucket',
  //       'feeStructure',
  //       'feeStructure.academicYear',
  //       'feeStructure.term',
  //       'feeStructure.tenantGradeLevel',
  //       'feeStructure.tenantGradeLevel.gradeLevel',
  //     ],
  //     order: { createdAt: 'DESC' },
  //   });
  // }
  

  // async findOne(id: string, tenantId: string): Promise<FeeStructureItem> {
  //   const feeStructureItem = await this.feeStructureItemRepository.findOne({
  //     where: { id, tenantId },
  //     relations: ['feeStructure', 'feeBucket'],
  //   });

  //   if (!feeStructureItem) {
  //     throw new NotFoundException('Fee structure item not found');
  //   }

  //   return feeStructureItem;
  // }

  async findByStructure(feeStructureId: string, tenantId: string): Promise<FeeStructureItem[]> {
    const feeStructure = await this.feeStructureRepository.findOne({
      where: { id: feeStructureId, tenantId },
    });

    if (!feeStructure) {
      throw new NotFoundException('Fee structure not found');
    }

    return this.feeStructureItemRepository.find({
      where: { feeStructureId, tenantId },
      relations: ['feeBucket'],
    });
  }

  async findMandatoryItems(feeStructureId: string, tenantId: string): Promise<FeeStructureItem[]> {
    const feeStructure = await this.feeStructureRepository.findOne({
      where: { id: feeStructureId, tenantId },
    });

    if (!feeStructure) {
      throw new NotFoundException('Fee structure not found');
    }

    return this.feeStructureItemRepository.find({
      where: { feeStructureId, tenantId, isMandatory: false },
      relations: ['feeBucket'],
    });
  }

  async findOptionalItems(feeStructureId: string, tenantId: string): Promise<FeeStructureItem[]> {
    const feeStructure = await this.feeStructureRepository.findOne({
      where: { id: feeStructureId, tenantId },
    });

    if (!feeStructure) {
      throw new NotFoundException('Fee structure not found');
    }

    return this.feeStructureItemRepository.find({
      where: { feeStructureId, tenantId, isMandatory: false },
      relations: ['feeBucket'],
    });
  }

  async getTotalAmount(feeStructureId: string, tenantId: string): Promise<number> {
    const feeStructure = await this.feeStructureRepository.findOne({
      where: { id: feeStructureId, tenantId },
    });

    if (!feeStructure) {
      throw new NotFoundException('Fee structure not found');
    }

    const result = await this.feeStructureItemRepository
      .createQueryBuilder('item')
      .select('SUM(item.amount)', 'total')
      .where('item.feeStructureId = :feeStructureId', { feeStructureId })
      .andWhere('item.tenantId = :tenantId', { tenantId })
      .getRawOne();

    return parseFloat(result.total) || 0;
  }

  async getMandatoryTotal(feeStructureId: string, tenantId: string): Promise<number> {
    const feeStructure = await this.feeStructureRepository.findOne({
      where: { id: feeStructureId, tenantId },
    });

    if (!feeStructure) {
      throw new NotFoundException('Fee structure not found');
    }

    const result = await this.feeStructureItemRepository
      .createQueryBuilder('item')
      .select('SUM(item.amount)', 'total')
      .where('item.feeStructureId = :feeStructureId', { feeStructureId })
      .andWhere('item.tenantId = :tenantId', { tenantId })
      .andWhere('item.isMandatory = :isMandatory', { isMandatory: true })
      .getRawOne();

    return parseFloat(result.total) || 0;
  }

  async getOptionalTotal(feeStructureId: string, tenantId: string): Promise<number> {
    const feeStructure = await this.feeStructureRepository.findOne({
      where: { id: feeStructureId, tenantId },
    });

    if (!feeStructure) {
      throw new NotFoundException('Fee structure not found');
    }

    const result = await this.feeStructureItemRepository
      .createQueryBuilder('item')
      .select('SUM(item.amount)', 'total')
      .where('item.feeStructureId = :feeStructureId', { feeStructureId })
      .andWhere('item.tenantId = :tenantId', { tenantId })
      .andWhere('item.isMandatory = :isMandatory', { isMandatory: false })
      .getRawOne();

    return parseFloat(result.total) || 0;
  }

  async create(tenantId: string, input: CreateFeeStructureItemInput): Promise<FeeStructureItem> {
    const { feeStructureId, feeBucketId, amount, isMandatory = true } = input;

    if (amount < 0) throw new BadRequestException('Amount must be ≥ 0');

    const structure = await this.feeStructureRepository.findOneBy({ id: feeStructureId, tenantId });
    if (!structure) throw new NotFoundException('Fee structure not found');

    const bucket = await this.feeBucketRepository.findOneBy({ id: feeBucketId, tenantId, isActive: true });
    if (!bucket) throw new NotFoundException('Fee bucket not found or inactive');

    const duplicate = await this.feeStructureItemRepository.findOneBy({ feeStructureId, feeBucketId, tenantId });
    if (duplicate) throw new ConflictException('This bucket is already assigned to the structure');

    const item = this.feeStructureItemRepository.create({ tenantId, feeStructureId, feeBucketId, amount, isMandatory });
    await this.feeStructureItemRepository.save(item);

    return this.feeStructureItemRepository.findOneOrFail({
      where: { id: item.id },
      relations: [
        'feeBucket',
        'feeStructure',
        'feeStructure.academicYear',
        'feeStructure.term',
        'feeStructure.tenantGradeLevel',
        'feeStructure.tenantGradeLevel.gradeLevel',
      ],
    });
  }

  async update(
    id: string,
    tenantId: string,
    input: UpdateFeeStructureItemInput,
  ): Promise<FeeStructureItem> {
    const { feeBucketId, amount, isMandatory } = input;

    if (feeBucketId === undefined && amount === undefined && isMandatory === undefined)
      throw new BadRequestException('No field to update');

    if (amount !== undefined && amount < 0) throw new BadRequestException('Amount must be ≥ 0');

    const item = await this.feeStructureItemRepository.findOneBy({ id, tenantId });
    if (!item) throw new NotFoundException('Fee structure item not found');

    if (feeBucketId !== undefined && feeBucketId !== item.feeBucketId) {
      const bucket = await this.feeBucketRepository.findOneBy({ id: feeBucketId, tenantId, isActive: true });
      if (!bucket) throw new NotFoundException('Fee bucket not found or inactive');

      const duplicate = await this.feeStructureItemRepository.findOneBy({ feeStructureId: item.feeStructureId, feeBucketId, tenantId });
      if (duplicate) throw new ConflictException('This bucket is already assigned to the structure');

      item.feeBucketId = feeBucketId;
    }

    if (amount !== undefined) item.amount = amount;
    if (isMandatory !== undefined) item.isMandatory = isMandatory;

    await this.feeStructureItemRepository.save(item);

    return this.feeStructureItemRepository.findOneOrFail({
      where: { id },
      relations: [
        'feeBucket',
        'feeStructure',
        'feeStructure.academicYear',
        'feeStructure.term',
        'feeStructure.tenantGradeLevel',
        'feeStructure.tenantGradeLevel.gradeLevel',
      ],
    });
  }

  // async remove(id: string, tenantId: string): Promise<boolean> {
  //   const feeStructureItem = await this.feeStructureItemRepository.findOne({
  //     where: { id, tenantId },
  //   });

  //   if (!feeStructureItem) {
  //     throw new NotFoundException('Fee structure item not found');
  //   }

  //   await this.feeStructureItemRepository.remove(feeStructureItem);
  //   return true;
  // }

  async remove(id: string, tenantId: string): Promise<boolean> {
    const item = await this.feeStructureItemRepository.findOneBy({ id, tenantId });
    if (!item) throw new NotFoundException('Fee structure item not found');
    await this.feeStructureItemRepository.remove(item);
    return true; 
  }

  async removeByStructure(feeStructureId: string, tenantId: string): Promise<number> {
    const result = await this.feeStructureItemRepository.delete({
      feeStructureId,
      tenantId,
    });

    return result.affected || 0;
  }

  async bulkCreate(
    tenantId: string,
    feeStructureId: string,
    items: Array<{ feeBucketId: string; amount: number; isMandatory?: boolean }>,
  ): Promise<FeeStructureItem[]> {
    const feeStructure = await this.feeStructureRepository.findOne({
      where: { id: feeStructureId, tenantId },
    });

    if (!feeStructure) {
      throw new NotFoundException('Fee structure not found');
    }

    const createdItems: FeeStructureItem[] = [];

    for (const item of items) {
      try {
        const createdItem = await this.create(tenantId, {
          feeStructureId,
          feeBucketId: item.feeBucketId,
          amount: item.amount,
          isMandatory: item.isMandatory ?? true,
        });
        createdItems.push(createdItem);
      } catch (error) {
        console.warn(`Failed to create fee structure item for bucket ${item.feeBucketId}:`, error.message);
      }
    }

    return createdItems;
  }


  async findOne(id: string, tenantId: string): Promise<FeeStructureItem> {
    const item = await this.feeStructureItemRepository.findOne({
      where: { id, tenantId },
      relations: [
        'feeBucket',
        'feeStructure',
        'feeStructure.academicYear',
        'feeStructure.term',
        'feeStructure.tenantGradeLevel',
        'feeStructure.tenantGradeLevel.gradeLevel',
      ],
    });
    if (!item) throw new NotFoundException('Fee structure item not found');
    return item;
  }


  async findAll(tenantId: string): Promise<FeeStructureItem[]> {
    return this.feeStructureItemRepository.find({
      where: { tenantId },
      relations: [
        'feeBucket',
        'feeStructure',
        'feeStructure.academicYear',
        'feeStructure.term',
        'feeStructure.tenantGradeLevel',
        'feeStructure.tenantGradeLevel.gradeLevel',
      ],
      order: { createdAt: 'DESC' },
    });
  }
}
