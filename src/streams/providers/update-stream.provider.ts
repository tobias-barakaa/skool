import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GradeLevel } from '../../level/entities/grade-level.entity';
import { Stream } from '../entities/streams.entity';
import { UpdateStreamInput } from '../dtos/update-stream.input';
import { ActiveUserData } from 'src/auth/interface/active-user.interface';


@Injectable()
export class UpdateStreamProvider {
  constructor(
    @InjectRepository(Stream)
    private readonly streamRepository: Repository<Stream>,
    @InjectRepository(GradeLevel)
    private readonly gradeLevelRepository: Repository<GradeLevel>,
  ) {}

  async execute(input: UpdateStreamInput, user: ActiveUserData): Promise<Stream> {
    // Check if user has permission (you can customize this logic)
    if (!user || !user.sub) {
      throw new ForbiddenException('User must be authenticated to update streams');
    }

    // Find existing stream
    const existingStream = await this.streamRepository.findOne({
      where: { id: input.id },
      relations: ['gradeLevel'],
    });

    if (!existingStream) {
      throw new NotFoundException(`Stream with ID ${input.id} not found`);
    }

    // Validate grade level if provided
    if (input.gradeLevelId) {
      const gradeLevel = await this.gradeLevelRepository.findOne({
        where: { id: input.gradeLevelId },
      });

      if (!gradeLevel) {
        throw new NotFoundException(`Grade level with ID ${input.gradeLevelId} not found`);
      }

      existingStream.gradeLevel = gradeLevel;
    }

    // Check if stream name already exists for the grade level (if name is being updated)
    if (input.name && input.name !== existingStream.name) {
      const gradeLevelId = input.gradeLevelId || existingStream.gradeLevel.id;
      const duplicateStream = await this.streamRepository.findOne({
        where: {
          name: input.name,
          gradeLevel: { id: gradeLevelId },
        },
      });

      if (duplicateStream && duplicateStream.id !== input.id) {
        throw new BadRequestException(
          `Stream with name "${input.name}" already exists for this grade level`
        );
      }
    }

    // Validate capacity if provided
    if (input.capacity !== undefined && input.capacity <= 0) {
      throw new BadRequestException('Stream capacity must be greater than 0');
    }

    // Update fields
    if (input.name !== undefined) existingStream.name = input.name;
    if (input.capacity !== undefined) existingStream.capacity = input.capacity;
    if (input.description !== undefined) existingStream.description = input.description;
    if (input.isActive !== undefined) existingStream.isActive = input.isActive;

    return this.streamRepository.save(existingStream);
  }
}