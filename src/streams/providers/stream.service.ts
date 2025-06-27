import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stream } from '../entities/streams.entity';
import { UpdateStreamProvider } from './update-stream.provider';
import { DeleteStreamProvider } from './delete-stream.provider';
import { CreateStreamInput } from '../dtos/create-stream.input';
import { UpdateStreamInput } from '../dtos/update-stream.input';
import { CreateStreamProvider } from './stream.create.provider';
import { ActiveUserData } from 'src/auth/interface/active-user.interface';

@Injectable()
export class StreamsService {
  constructor(
    @InjectRepository(Stream)
    private readonly streamRepository: Repository<Stream>,
    private readonly createStreamProvider: CreateStreamProvider,
    private readonly updateStreamProvider: UpdateStreamProvider,
    private readonly deleteStreamProvider: DeleteStreamProvider,
  ) {}

  // async createStream(input: CreateStreamInput, user: ActiveUserData): Promise<Stream> {
  //   if (!user.schoolId) {
  //       throw new BadRequestException('User is not associated with any school');
  //     }
    
  //     return this.createStreamProvider.execute(input, user, user.schoolId);

  // }

  async createStream(input: CreateStreamInput, user: ActiveUserData): Promise<Stream> {
    if (!user.tenantId) {
      throw new BadRequestException('User is not associated with a tenant');
    }
  
    return this.createStreamProvider.execute(input, user, user.tenantId); // Pass tenantId instead
  }
  

  async updateStream(input: UpdateStreamInput, user: ActiveUserData): Promise<Stream> {
    return this.updateStreamProvider.execute(input, user);
  }

  async deleteStream(id: string, user: ActiveUserData): Promise<boolean> {
    return this.deleteStreamProvider.execute(id, user);
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