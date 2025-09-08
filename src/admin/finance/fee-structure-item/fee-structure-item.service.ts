import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeeStructureItem } from './entities/fee-structure-item.entity';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';

@Injectable()
export class FeeStructureItemService {
  constructor(
    @InjectRepository(FeeStructureItem)
    private readonly feeStructureItemRepository: Repository<FeeStructureItem>,
  ) {}

  async findByStructure(feeStructureId: string, user: ActiveUserData): Promise<FeeStructureItem[]> {
    return await this.feeStructureItemRepository.find({
      where: { tenantId: user.tenantId, feeStructureId },
      relations: ['feeBucket'],
      order: { feeBucket: { name: 'ASC' } }
    });
  }

  async findOne(id: string, user: ActiveUserData): Promise<FeeStructureItem> {
    const item = await this.feeStructureItemRepository.findOne({
      where: { id, tenantId: user.tenantId },
      relations: ['feeBucket', 'feeStructure']
    });

    if (!item) {
      throw new NotFoundException('Fee structure item not found');
    }

    return item;
  }

  async getTotalAmountByStructure(feeStructureId: string, user: ActiveUserData): Promise<number> {
    const result = await this.feeStructureItemRepository
      .createQueryBuilder('item')
      .select('SUM(item.amount)', 'total')
      .where('item.feeStructureId = :feeStructureId', { feeStructureId })
      .andWhere('item.tenantId = :tenantId', { tenantId: user.tenantId })
      .getRawOne();

    return parseFloat(result.total) || 0;
  }
}