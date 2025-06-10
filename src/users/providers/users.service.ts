import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { User } from '../entities/user.entity';
import { UsersCreateProvider } from './users-create.provider';
import { UserRole } from '../enums/user-role.enum';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly usersCreateProvider: UsersCreateProvider,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(
    email: string,
    username: string,
    password: string,
    schoolId: string,
    userRole: UserRole,
  ): Promise<User> {
    return this.usersCreateProvider.createUser(
      email,
      username,
      password,
      schoolId,
      userRole,
    );
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({ relations: ['school'] }); // Include school relationship if needed
  }

   

}