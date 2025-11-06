import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import { HashingProvider } from 'src/admin/auth/providers/hashing.provider';
import { GenerateTokenProvider } from 'src/admin/auth/providers/generate-token.provider';
import { SuperAdminSignupInput } from '../dtos/super-admin-signup.input';
import { UserAlreadyExistsException } from 'src/admin/common/exceptions/business.exception';

@Injectable()
export class SuperAdminAuthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly hashingProvider: HashingProvider,
    private readonly generateTokens: GenerateTokenProvider,
  ) {}

  async signup(input: SuperAdminSignupInput) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
  
    try {
      const existing = await queryRunner.manager.findOne(User, {
        where: { email: input.email },
      });
  
      if (existing) throw new UserAlreadyExistsException(input.email);
  
      const hashed = await this.hashingProvider.hashPassword(input.password);
  
      const user = queryRunner.manager.create(User, {
        email: input.email,
        password: hashed,
        name: input.name,
        isGlobalAdmin: true,
        schoolUrl: "global-admin",
      });
  
      const savedUser = await queryRunner.manager.save(user);
  
      await queryRunner.commitTransaction();
  
      const tokens = await this.generateTokens.generateSuperAdminToken(savedUser);
  
      return {
        user: savedUser,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        role: "SUPER_ADMIN",  
      };
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }


// admin/users/user.service.ts
async getAllUsers(): Promise<User[]> {
    const userRepository = this.dataSource.getRepository(User);
    return userRepository.find({
      relations: ['memberships', 'memberships.tenant'],
    });
  }
  
  

 
  
}
