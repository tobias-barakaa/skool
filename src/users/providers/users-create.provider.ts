// users-create.provider.ts
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { SchoolCreateProvider } from '../../school/providers/school-create.provider';
import { School } from 'src/school/entities/school.entity';
import { BusinessException, UserAlreadyExistsException } from 'src/common/exceptions/business.exception';

@Injectable()
export class UsersCreateProvider {
  private readonly logger = new Logger(UsersCreateProvider.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly schoolCreateProvider: SchoolCreateProvider,
  ) {}

  async createUser(
    name: string,
    email: string,
    passwordPlain: string,
    schoolName: string,
    userRole: string 
  ): Promise<{ user: User; school: School }> {
    this.logger.log(`Attempting to create user with email: ${email}`);
  
    const existingUser = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email']
    });
  
    if (existingUser) {
      // this.logger.warn(`User creation failed: User with email ${email} already exists`);
      throw new UserAlreadyExistsException(email);
    }
  
    try {
      const school = await this.schoolCreateProvider.createSchool(schoolName);
  
      const saltRounds = 12;
      const password = await bcrypt.hash(passwordPlain, saltRounds);
  
      const newUser = this.userRepository.create({
        name,
        email,
        password,
        school,
        userRole,
      });
  
      const savedUser = await this.userRepository.save(newUser);
      this.logger.log(`User created successfully with ID: ${savedUser.id}`);
  
      return { user: savedUser, school };
    } catch (error) {
      this.logger.error(`Failed to create user: ${error.message}`, error.stack);
      
      if (error instanceof BusinessException) {
        throw error;
      }
      
      if (error instanceof QueryFailedError) {
        if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
          throw new UserAlreadyExistsException(email);
        }
      }
      
      throw new BusinessException(
        'Failed to create user',
        'USER_CREATION_FAILED',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { originalError: error.message }
      );
    }
  }
}
