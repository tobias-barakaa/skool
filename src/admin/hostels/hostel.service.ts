import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hostel } from './entities/hostel.entity';
import { CreateHostelInput } from './dtos/create-hostel.input';
import { UpdateHostelInput } from './dtos/update-hostel.input';

@Injectable()
export class HostelService {
  constructor(
    @InjectRepository(Hostel)
    private hostelRepository: Repository<Hostel>,
  ) {}

  async findAll(tenantId: string): Promise<Hostel[]> {
    return this.hostelRepository.find({ where: { tenantId } });
  }

  async create(input: CreateHostelInput, tenantId: string): Promise<Hostel> {
    const hostel = this.hostelRepository.create({ ...input, tenantId });
    return this.hostelRepository.save(hostel);
  }

  async findOne(id: string): Promise<Hostel> {
    const hostel = await this.hostelRepository.findOne({ where: { id } });
    if (!hostel) {
      throw new Error(`Hostel with id ${id} not found`);
    }
    return hostel;
  }

  async update(input: UpdateHostelInput): Promise<Hostel> {
    await this.hostelRepository.update(input.id, input);
    return this.findOne(input.id);
  }

  async remove(id: string): Promise<boolean> {
    await this.hostelRepository.delete(id);
    return true;
  }
}
