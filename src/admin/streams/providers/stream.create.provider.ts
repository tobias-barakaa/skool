import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { Repository } from 'typeorm';
import { GradeLevel } from '../../level/entities/grade-level.entity';
import { CreateStreamInput } from '../dtos/create-stream.input';
import { Stream } from '../entities/streams.entity';



@Injectable()
export class CreateStreamProvider {
  constructor(
    @InjectRepository(Stream)
    private readonly streamRepository: Repository<Stream>,
    @InjectRepository(GradeLevel)
    private readonly gradeLevelRepository: Repository<GradeLevel>,
  ) {}

  async execute(
    input: CreateStreamInput,
    user: ActiveUserData,
    tenantId: string,
  ): Promise<Stream> {
    // Check if user is authenticated
    if (!user || !user.sub) {
      throw new ForbiddenException(
        'User must be authenticated to create streams',
      );
    }

    console.log('Creating stream with input:', input);

    // Validate grade level exists
    const gradeLevel = await this.gradeLevelRepository.findOne({
      where: { id: input.gradeLevelId },
      relations: ['schoolLevel', 'schoolLevel.schoolType'],
    });

    if (!gradeLevel) {
      throw new NotFoundException(
        `Grade level with ID ${input.gradeLevelId} not found`,
      );
    }

    // Check if stream name already exists for this grade level AND tenant
    const existingStream = await this.streamRepository.findOne({
      where: {
        name: input.name,
        gradeLevel: { id: input.gradeLevelId },
        tenantId, // Add tenantId to the uniqueness check
      },
    });

    if (existingStream) {
      throw new BadRequestException(
        `Stream with name "${input.name}" already exists for this grade level in your organization`,
      );
    }

    // Validate capacity if provided
    if (input.capacity && input.capacity <= 0) {
      throw new BadRequestException('Stream capacity must be greater than 0');
    }

    const stream = this.streamRepository.create({
      name: input.name,
      capacity: input.capacity,
      description: input.description,
      isActive: input.isActive ?? true,
      gradeLevel,
      tenantId,
    });

    return this.streamRepository.save(stream);
  }
}
