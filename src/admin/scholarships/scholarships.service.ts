import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Scholarship } from './entities/scholarship.entity';
import { CreateScholarshipInput } from './dtos/create-scholarship.input';
import { UpdateScholarshipInput } from './dtos/update-scholarship.input';

@Injectable()
export class ScholarshipsService {
  constructor(
    @InjectRepository(Scholarship)
    private readonly scholarshipRepo: Repository<Scholarship>,
  ) {}

  async create(input: CreateScholarshipInput, tenantId: string): Promise<Scholarship> {

    const scholarship = this.scholarshipRepo.create(input);
    return this.scholarshipRepo.save(scholarship);
  }
  
  

  async findAll(): Promise<Scholarship[]> {
    return this.scholarshipRepo.find();
  }

  async findOne(id: string): Promise<Scholarship> {
    const scholarship = await this.scholarshipRepo.findOne({ where: { id } });
    if (!scholarship) throw new NotFoundException(`Scholarship ${id} not found`);
    return scholarship;
  }

  async update(input: UpdateScholarshipInput): Promise<Scholarship> {
    const scholarship = await this.findOne(input.id);
    Object.assign(scholarship, input);
    return this.scholarshipRepo.save(scholarship);
  }

  async remove(id: string): Promise<boolean> {
    await this.scholarshipRepo.delete(id);
    return true;
  }
}


