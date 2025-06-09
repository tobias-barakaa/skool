// src/user/user.service.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { UserRole } from '../enums/user-role.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Directly creates a new user record in the database.
   * This is a utility function used by the resolver.
   */
  async create(email: string, username: string, passwordPlain: string, schoolId: string, userRole: UserRole): Promise<User> {
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException(`User with email '${email}' already exists.`);
    }

    const password_hash = await bcrypt.hash(passwordPlain, 10);
    const newUser = this.userRepository.create({
      email,
      username,
      password_hash,
      schoolId,
      userRole,
    });
    return this.userRepository.save(newUser);
  }
}