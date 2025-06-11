import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { 
  BusinessException, 
  UserAlreadyExistsException,
  DatabaseException,
  ValidationException 
} from '../../common/exceptions/business.exception';
import { SchoolCreateProvider } from '../../school/providers/school-create.provider';
import { School } from 'src/school/entities/school.entity';

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
    userRole: 'SUPER_ADMIN' 
  ): Promise<{ user: User; school: School }> {
    this.logger.log(`Attempting to create user with email: ${email}`);
  
    // Input validation
    if (!email || !email.includes('@')) {
      throw new ValidationException('Invalid email format');
    }

    if (!passwordPlain || passwordPlain.length < 8) {
      throw new ValidationException('Password must be at least 8 characters long');
    }

    if (!schoolName?.trim()) {
      throw new ValidationException('School name is required');
    }

    try {
      await this.checkUserExists(email);
      
      const school = await this.schoolCreateProvider.createSchool(schoolName);
  
      const password = await this.hashPassword(passwordPlain);
  
      const user = await this.saveUser({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        school,
        userRole,
      });
  
      this.logger.log(`User created successfully with ID: ${user.id}`);
      return { user, school };

    } catch (error) {
      this.logger.error(`Failed to create user: ${error.message}`, error.stack);
      
      // Re-throw business exceptions as-is
      if (error instanceof BusinessException) {
        throw error;
      }

      // Handle database errors
      if (error instanceof QueryFailedError) {
        throw new DatabaseException(error.message, error);
      }
      
      // Wrap other errors
      throw new DatabaseException(
        `Unexpected error during user creation: ${error.message}`,
        error
      );
    }
  }

  private async checkUserExists(email: string): Promise<void> {
    const existingUser = await this.userRepository.findOne({ 
      where: { email: email.toLowerCase().trim() },
      select: ['id', 'email']
    });
  
    if (existingUser) {
      this.logger.warn(`User creation failed: User with email ${email} already exists`);
      throw new UserAlreadyExistsException(email);
    }
  }

  private async hashPassword(password: string): Promise<string> {
    try {
      const saltRounds = 12;
      return await bcrypt.hash(password, saltRounds);
    } catch (error) {
      throw new DatabaseException('Failed to hash password', error);
    }
  }

  private async saveUser(userData: Partial<User>): Promise<User> {
    try {
      const newUser = this.userRepository.create(userData);
      return await this.userRepository.save(newUser);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        // Handle specific database constraints
        if (error.message.includes('duplicate key')) {
          throw new UserAlreadyExistsException(userData.email!);
        }
      }
      throw error;
    }
  }
}