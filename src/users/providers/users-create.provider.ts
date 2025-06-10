import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { UserAlreadyExistsException } from '../../common/exceptions/business.exception';
import { UserRole } from '../enums/user-role.enum';

@Injectable()
export class UsersCreateProvider {
  private readonly logger = new Logger(UsersCreateProvider.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createUser(
    email: string,
    username: string,
    passwordPlain: string,
    schoolId: string,
    userRole: UserRole,
  ): Promise<User> {
    this.logger.log(`Attempting to create user with email: ${email}`);

    const existingUser = await this.userRepository.findOne({ 
      where: { email },
      select: ['id', 'email']
    });

    if (existingUser) {
      this.logger.warn(`User creation failed: User with email ${email} already exists`);
      throw new UserAlreadyExistsException(email);
    }

    try {
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(passwordPlain, saltRounds);

      const newUser = this.userRepository.create({
        email,
        username,
        password_hash,
        schoolId,
        userRole,
      });

      const savedUser = await this.userRepository.save(newUser);
      this.logger.log(`User created successfully with ID: ${savedUser.id}`);

      return savedUser;
    } catch (error) {
      this.logger.error(`Failed to create user: ${error.message}`, error.stack);
      throw error;
    }
  }
}