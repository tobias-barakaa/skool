// providers/streams.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stream } from '../entities/streams.entity';
import { CreateStreamProvider } from './stream.create.provider';
import { CreateStreamInput } from '../dtos/create-stream.input';

@Injectable()
export class StreamsService {
  constructor(
    @InjectRepository(Stream)
    private readonly streamRepository: Repository<Stream>,
    private readonly createStreamProvider: CreateStreamProvider,
  ) {}

  async createStream(input: CreateStreamInput): Promise<Stream> {
    return this.createStreamProvider.execute(input);
  }

  async findAll(): Promise<Stream[]> {
    return this.streamRepository.find({
      relations: ['gradeLevel'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Stream> {
    const stream = await this.streamRepository.findOne({
      where: { id },
      relations: ['gradeLevel'],
    });

    if (!stream) {
      throw new NotFoundException(`Stream with ID ${id} not found`);
    }

    return stream;
  }

  async findByGradeLevel(gradeLevelId: string): Promise<Stream[]> {
    return this.streamRepository.find({
      where: { gradeLevel: { id: gradeLevelId } },
      relations: ['gradeLevel'],
      order: { name: 'ASC' },
    });
  }

  async findActiveStreams(): Promise<Stream[]> {
    return this.streamRepository.find({
      where: { isActive: true },
      relations: ['gradeLevel'],
      order: { name: 'ASC' },
    });
  }
}