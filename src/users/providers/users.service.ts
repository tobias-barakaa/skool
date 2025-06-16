// src/users/services/users.service.ts
import { BadRequestException, Injectable, Logger, RequestTimeoutException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UsersCreateProvider } from '../providers/users-create.provider';
import { School } from '../../school/entities/school.entity';
import { CreateUserInput } from '../dtos/create-user.input';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly usersCreateProvider: UsersCreateProvider,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserInput: CreateUserInput): Promise<{ user: User; school: School, tokens: { accessToken: string; refreshToken: string } }> {
    const result = await this.usersCreateProvider.createUser(
      createUserInput.name,
      createUserInput.email,
      createUserInput.password,
      createUserInput.schoolName,
      createUserInput.userRole
    );


    if (!result) {
      throw new Error('Failed to create user');
    }

    if (!result.user || !result.school) {
      throw new Error('Invalid result structure');
    }

    console.log(`User created successfully::::: ${result.user.email} for school: ${result.school.schoolName}`);
    return { user: result.user, school: result.school, tokens: result.tokens };
  }


  public async findOneById(id: number) {
    let user: User | null = null;
    try {
        user = await this.userRepository.findOne({
            where: {
                id: id.toString(),
            },
        })
    } catch (error) {
        throw new RequestTimeoutException('Error while finding user', {
            description: "Error Connecting to the database"
        })
        
    }

    /**
     * handle user does not exits
     */

    if(!user) {
        throw new BadRequestException('User does not exist');
    }

    return user;
    
}

  async findAll(): Promise<User[]> {
    return this.userRepository.find({ relations: ['school'] });
  }
}