// users-create.provider.ts
import { forwardRef, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { SchoolCreateProvider } from '../../school/providers/school-create.provider';
import { School } from 'src/school/entities/school.entity';
import { BusinessException, UserAlreadyExistsException } from 'src/common/exceptions/business.exception';
import { HashingProvider } from 'src/auth/providers/hashing.provider';
import { GenerateTokenProvider } from 'src/auth/providers/generate-token.provider';

@Injectable()
export class UsersCreateProvider {
  private readonly logger = new Logger(UsersCreateProvider.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly schoolCreateProvider: SchoolCreateProvider,
    @Inject(forwardRef(() => HashingProvider))
        private readonly hashingProvider: HashingProvider,

         /**
    * Inject generateTokensProvider
    * 
    */
  @Inject(forwardRef(() => GenerateTokenProvider))
   private readonly generateTokensProvider: GenerateTokenProvider,
  ) {}

  async createUser(
    name: string,
    email: string,
    passwordPlain: string,
    schoolName: string,
    userRole: string,
    schoolUrl: string
  ): Promise<{ user: User; school: School; tokens: { accessToken: string; refreshToken: string } }> {
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

  const newUser = this.userRepository.create({
    name,
    email,
    password: await this.hashingProvider.hashPassword(passwordPlain),
    school,
    userRole,
    schoolUrl
  });
  
      const savedUser = await this.userRepository.save(newUser);
      this.logger.log(`User created successfully with ID: ${savedUser.id}`);
      const tokens = await this.generateTokensProvider.generateTokens(savedUser);
      const { accessToken, refreshToken } = tokens;

      console.log(`tokens::::: ${JSON.stringify(tokens)}`);
      return {
        user: savedUser,
        school,
        tokens: {
          accessToken,
          refreshToken,
        }
      };
      // return { user: savedUser, school };
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
