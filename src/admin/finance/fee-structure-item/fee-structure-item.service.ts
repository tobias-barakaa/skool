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

  async create(
    tenantId: string,
    input: CreateFeeStructureItemInput,
  ): Promise<FeeStructureItem> {
    const { feeStructureId, feeBucketId, amount, isMandatory = true } = input;
  
    const feeStructure = await this.feeStructureRepository.findOne({
      where: { id: feeStructureId, tenantId },
    });
    console.log(feeStructure, 'this was the fee structure')
    if (!feeStructure) {
      throw new NotFoundException('Fee structure not found for this tenant');
    }
    const feeBucket = await this.feeBucketRepository.findOne({
      where: { id: feeBucketId, tenantId, isActive: true },
    });
    if (!feeBucket) {
      throw new NotFoundException('Fee bucket not found or inactive');
    }
  
    const existingItem = await this.feeStructureItemRepository.findOne({
      where: { feeStructureId, feeBucketId, tenantId },
    });
    if (existingItem) {
      throw new ConflictException('This fee bucket is already assigned to the fee structure');
    }
    const newItem = this.feeStructureItemRepository.create({
      tenantId,
      feeStructureId,
      feeBucketId,
      amount,
      isMandatory,
    });
    await this.feeStructureItemRepository.save(newItem);
    return this.feeStructureItemRepository.findOneOrFail({
      where: { id: newItem.id },
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
  

  async findOne(id: string, tenantId: string): Promise<FeeStructureItem> {
    const feeStructureItem = await this.feeStructureItemRepository.findOne({
      where: { id, tenantId },
      relations: ['feeStructure', 'feeBucket'],
    });

    if (!feeStructureItem) {
      throw new NotFoundException('Fee structure item not found');
    }

    return feeStructureItem;
  }

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

  async update(
    id: string,
    tenantId: string,
    updateFeeStructureItemInput: UpdateFeeStructureItemInput,
  ): Promise<FeeStructureItem> {
    const { feeBucketId, amount, isMandatory } = updateFeeStructureItemInput;

    const feeStructureItem = await this.feeStructureItemRepository.findOne({
      where: { id, tenantId },
    });

    if (!feeStructureItem) {
      throw new NotFoundException('Fee structure item not found');
    }

    if (feeBucketId) {
      const feeBucket = await this.feeBucketRepository.findOne({
        where: { id: feeBucketId, tenantId, isActive: true },
      });

      if (!feeBucket) {
        throw new NotFoundException('Fee bucket not found or is not active');
      }

      if (feeBucketId !== feeStructureItem.feeBucketId) {
        const existingItem = await this.feeStructureItemRepository.findOne({
          where: { 
            feeStructureId: feeStructureItem.feeStructureId, 
            feeBucketId, 
            tenantId 
          },
        });

        if (existingItem) {
          throw new ConflictException('Fee structure item already exists for this bucket');
        }
      }

      feeStructureItem.feeBucketId = feeBucketId;
    }

    if (amount !== undefined) {
      feeStructureItem.amount = amount;
    }

    if (isMandatory !== undefined) {
      feeStructureItem.isMandatory = isMandatory;
    }

    return this.feeStructureItemRepository.save(feeStructureItem);
  }

  async remove(id: string, tenantId: string): Promise<boolean> {
    const feeStructureItem = await this.feeStructureItemRepository.findOne({
      where: { id, tenantId },
    });

    if (!feeStructureItem) {
      throw new NotFoundException('Fee structure item not found');
    }

    await this.feeStructureItemRepository.remove(feeStructureItem);
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
}
