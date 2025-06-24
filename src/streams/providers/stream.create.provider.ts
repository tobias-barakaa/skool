// providers/create-stream.provider.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GradeLevel } from '../../level/entities/grade-level.entity';
import { Stream } from '../entities/streams.entity';
import { CreateStreamInput } from '../dtos/create-stream.input';

@Injectable()
export class CreateStreamProvider {
  constructor(
    @InjectRepository(Stream)
    private readonly streamRepository: Repository<Stream>,
    @InjectRepository(GradeLevel)
    private readonly gradeLevelRepository: Repository<GradeLevel>,
  ) {}

  async execute(input: CreateStreamInput): Promise<Stream> {
    // Validate grade level exists
    const gradeLevel = await this.gradeLevelRepository.findOne({
      where: { id: input.gradeLevelId },
    });

    if (!gradeLevel) {
      throw new NotFoundException(`Grade level with ID ${input.gradeLevelId} not found`);
    }

    // Check if stream name already exists for this grade level
    const existingStream = await this.streamRepository.findOne({
      where: {
        name: input.name,
        gradeLevel: { id: input.gradeLevelId },
      },
    });

    if (existingStream) {
      throw new BadRequestException(
        `Stream with name "${input.name}" already exists for this grade level`
      );
    }

    // Validate capacity if provided
    if (input.capacity && input.capacity <= 0) {
      throw new BadRequestException('Stream capacity must be greater than 0');
    }

    // Create the stream
    const stream = this.streamRepository.create({
      name: input.name,
      capacity: input.capacity,
      description: input.description,
      isActive: input.isActive ?? true,
      gradeLevel,
    });

    return this.streamRepository.save(stream);
  }
}