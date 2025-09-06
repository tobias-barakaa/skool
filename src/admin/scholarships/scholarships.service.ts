import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Scholarship } from './entities/scholarship.entity';
import { CreateScholarshipInput } from './dtos/create-scholarship.input';
import { UpdateScholarshipInput } from './dtos/update-scholarship.input';
import { Roles } from 'src/iam/decorators/roles.decorator';
import { MembershipRole } from '../user-tenant-membership/entities/user-tenant-membership.entity';

@Injectable()
@Roles(MembershipRole.SCHOOL_ADMIN)
export class ScholarshipsService {
  constructor(
    @InjectRepository(Scholarship)
    private readonly scholarshipRepo: Repository<Scholarship>,
  ) {}

  async create(input: CreateScholarshipInput, tenantId: string): Promise<Scholarship> {

    const scholarship = this.scholarshipRepo.create({
      ...input,
      tenantId, 
    })
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
    const scholarship = await this.scholarshipRepo.findOne({ where: { id: input.id } });
    if (!scholarship) throw new NotFoundException('Scholarship not found');
  
    if (input.name !== undefined) scholarship.name = input.name;
    if (input.description !== undefined) scholarship.description = input.description;
    if (input.amount !== undefined) scholarship.amount = input.amount;
    if (input.type !== undefined) scholarship.type = input.type; 
  
    return this.scholarshipRepo.save(scholarship);
  }
  

  async remove(id: string): Promise<boolean> {
    await this.scholarshipRepo.delete(id);
    return true;
  }
}