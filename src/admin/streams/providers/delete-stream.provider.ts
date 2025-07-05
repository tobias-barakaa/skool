import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { Repository } from 'typeorm';
import { Stream } from '../entities/streams.entity';

@Injectable()
export class DeleteStreamProvider {
  constructor(
    @InjectRepository(Stream)
    private readonly streamRepository: Repository<Stream>,
  ) {}

  async execute(id: string, user: ActiveUserData): Promise<boolean> {
    // Check if user has permission
    if (!user || !user.sub) {
      throw new ForbiddenException(
        'User must be authenticated to delete streams',
      );
    }

    // Find existing stream
    const existingStream = await this.streamRepository.findOne({
      where: { id },
      relations: ['gradeLevel'],
    });

    if (!existingStream) {
      throw new NotFoundException(`Stream with ID ${id} not found`);
    }

    // Optional: Check if stream has associated data before deletion
    // You might want to check for students, classes, etc.
    // const hasStudents = await this.checkIfStreamHasStudents(id);
    // if (hasStudents) {
    //   throw new BadRequestException('Cannot delete stream with associated students');
    // }

    try {
      await this.streamRepository.remove(existingStream);
      return true;
    } catch (error) {
      throw new BadRequestException(
        'Failed to delete stream. It may have associated data.',
      );
    }
  }

  // Optional: Helper method to check for associated data
  // private async checkIfStreamHasStudents(streamId: string): Promise<boolean> {
  //   // Implement your logic to check if stream has students
  //   return false;
  // }
}
