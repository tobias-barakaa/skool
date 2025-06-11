// src/users/providers/users-create.provider.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { School } from '../../school/entities/school.entity';
import { UserAlreadyExistsException } from '../../common/exceptions/business.exception';
import { UserRole } from '../enums/user-role.enum';
import { SchoolAlreadyExistsException } from '../../common/exceptions/business.exception';

@Injectable()
export class UsersCreateProvider {
  private readonly logger = new Logger(UsersCreateProvider.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
  ) {}

  private slugifySchoolName(schoolName: string): string {
    // Remove 'school' from the end if it exists (case insensitive)
    const cleanedName = schoolName.replace(/\bschool\b/gi, '').trim();
    // Convert to lowercase and replace spaces with hyphens
    return cleanedName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '');
  }

  async createUser(
    name: string,
    email: string,
    passwordPlain: string,
    schoolName: string,
    userRole: string,
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

    // Generate subdomain from school name
    const subdomain = this.slugifySchoolName(schoolName);

    // Check if school with subdomain already exists
    const existingSchool = await this.schoolRepository.findOne({
      where: { subdomain },
      select: ['schoolId', 'subdomain']
    });

    if (existingSchool) {
      this.logger.warn(`School creation failed: School with subdomain ${subdomain} already exists`);
      throw new SchoolAlreadyExistsException(subdomain);
    }

    try {
      // Create the school first
      const newSchool = this.schoolRepository.create({
        schoolName,
        subdomain,
        isActive: true,
      });
      const savedSchool = await this.schoolRepository.save(newSchool);
      this.logger.log(`School created successfully with ID: ${savedSchool.schoolId}`);

      // Hash the password
      const saltRounds = 12;
      const password = await bcrypt.hash(passwordPlain, saltRounds);

      // Create the user
      const newUser = this.userRepository.create({
        name,
        email,
        password,
        school: savedSchool,
        userRole,
      });

      const savedUser = await this.userRepository.save(newUser);
      this.logger.log(`User created successfully with ID: ${savedUser.id}`);

      return { user: savedUser, school: savedSchool };
    } catch (error) {
      this.logger.error(`Failed to create user or school: ${error.message}`, error.stack);
      throw error;
    }
  }
}