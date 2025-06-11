// src/users/providers/users-create.provider.ts
import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { BusinessException, UserAlreadyExistsException } from '../../common/exceptions/business.exception';
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
    userRole: string 
  ): Promise<{ user: User; school: School }> {
    this.logger.log(`Attempting to create user with email: ${email}`);
  
    // Check if user with email already exists
    const existingUser = await this.userRepository.findOne({ 
      where: { email },
      select: ['id', 'email']
    });
  
    if (existingUser) {
      this.logger.warn(`User creation failed: User with email ${email} already exists`);
      throw new UserAlreadyExistsException(email);
    }
  
    try {
      // Create the school using SchoolCreateProvider
      const school = await this.schoolCreateProvider.createSchool(schoolName);
  
      // Hash the password
      const saltRounds = 12;
      const password = await bcrypt.hash(passwordPlain, saltRounds);
  
      // Create the user
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
      
      // Re-throw business exceptions as-is
      if (error instanceof BusinessException) {
        throw error;
      }
      
      // Wrap other errors in a generic business exception
      throw new Error(
        `Failed to create user: ${error.message}`
      );
    }
  }
}