import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeeBucket } from './entities/fee-bucket.entity';
import { CreateFeeBucketInput, UpdateFeeBucketInput } from './dtos/create-fee-bucket.input';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';

@Injectable()
export class FeeBucketService {
  constructor(
    @InjectRepository(FeeBucket)
    private readonly feeBucketRepository: Repository<FeeBucket>,
  ) {}

  async create(input: CreateFeeBucketInput, user: ActiveUserData): Promise<FeeBucket> {
    const existingBucket = await this.feeBucketRepository.findOne({
      where: { tenantId: user.tenantId, name: input.name }
    });

    if (existingBucket) {
      throw new ConflictException('Fee bucket with this name already exists');
    }

    const feeBucket = this.feeBucketRepository.create({
      ...input,
      tenantId: user.tenantId,
    });

    return await this.feeBucketRepository.save(feeBucket);
  }

  async findAll(user: ActiveUserData): Promise<FeeBucket[]> {
    return await this.feeBucketRepository.find({
      where: { tenantId: user.tenantId, isActive: true },
      order: { name: 'ASC' }
    });
  }

  async findOne(id: string, user: ActiveUserData): Promise<FeeBucket> {
    const feeBucket = await this.feeBucketRepository.findOne({
      where: { id, tenantId: user.tenantId }
    });

    if (!feeBucket) {
      throw new NotFoundException('Fee bucket not found');
    }

    return feeBucket;
  }

  async update(id: string, input: UpdateFeeBucketInput, user: ActiveUserData): Promise<FeeBucket> {
    const feeBucket = await this.findOne(id, user);

    if (input.name && input.name !== feeBucket.name) {
      const existingBucket = await this.feeBucketRepository.findOne({
        where: { tenantId: user.tenantId, name: input.name }
      });

      if (existingBucket) {
        throw new ConflictException('Fee bucket with this name already exists');
      }
    }

    Object.assign(feeBucket, input);
    return await this.feeBucketRepository.save(feeBucket);
  }

  async remove(id: string, user: ActiveUserData): Promise<boolean> {
    const feeBucket = await this.findOne(id, user);
    await this.feeBucketRepository.remove(feeBucket);
    return true;
  }
}