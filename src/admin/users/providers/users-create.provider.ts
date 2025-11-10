// users-create.provider.ts
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import slugify from 'slugify';
import { GenerateTokenProvider } from 'src/admin/auth/providers/generate-token.provider';
import { HashingProvider } from 'src/admin/auth/providers/hashing.provider';
import { DataSource, Repository } from 'typeorm';
import { AuthResponse, SignupInput } from '../dtos/signUp-input';
import { User } from '../entities/user.entity';
import { MembershipRole, UserTenantMembership } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import { SchoolAlreadyExistsException, UserAlreadyExistsException } from 'src/admin/common/exceptions/business.exception';
import { TokenProvider } from 'src/admin/auth/providers/token.provider';

@Injectable()
export class UsersCreateProvider {
  constructor(
    @Inject(forwardRef(() => HashingProvider))
    private readonly hashingProvider: HashingProvider,

    @Inject(forwardRef(() => GenerateTokenProvider))
    private readonly generateTokensProvider: GenerateTokenProvider,
    private readonly tokenPair: TokenProvider,
    private dataSource: DataSource,
  ) {}

  async createUser(signupInput: SignupInput): Promise<AuthResponse> {
    // this.logger.log(`Attempting to create user with email: ${JSON.stringify(input.email)}`);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    const schoolUrl =
      signupInput.schoolUrl ??
      slugify(signupInput.schoolName, { lower: true, strict: true });

    try {
      const existingTenant = await queryRunner.manager.findOne(Tenant, {
        where: { subdomain: schoolUrl },
      });

      if (existingTenant) {
        // this.logger.warn(`User creation failed: User with email ${email} already exists`);
        throw new SchoolAlreadyExistsException(schoolUrl);
      }

      const existingUser = await queryRunner.manager.findOne(User, {
        where: { email: signupInput.email },
      });

      if (existingUser) {
        throw new UserAlreadyExistsException(signupInput.email);
      }

      // Create user

      // console.log('🚨 Password before hashing:', signupInput.password);

      const user = queryRunner.manager.create(User, {
        email: signupInput.email,
        password: await this.hashingProvider.hashPassword(signupInput.password),
        name: signupInput.name,
        schoolUrl: schoolUrl,
      });
      const savedUser = await queryRunner.manager.save(user);

      // Create tenant
      const tenant = queryRunner.manager.create(Tenant, {
        name: signupInput.schoolName,
        subdomain: schoolUrl,
      });
      const savedTenant = await queryRunner.manager.save(tenant);

      const membership = queryRunner.manager.create(UserTenantMembership, {
        userId: savedUser.id,
        tenantId: savedTenant.id,
        role: MembershipRole.SCHOOL_ADMIN,
        joinedAt: new Date(),
      });

      const savedMembership = await queryRunner.manager.save(membership);
      console.log('✅ Membership created::::', savedMembership);

      await queryRunner.commitTransaction();

      const tokens = await this.tokenPair.generateTenantUserTokens(
        savedUser,
        savedMembership,
        savedTenant,
      );
      const { accessToken, refreshToken } = tokens;

      const subdomainUrl = `${savedTenant.subdomain}.squl.co.ke`;

      return {
        user: savedUser,
        membership: {
          ...savedMembership,
          role: savedMembership.role,
        },
        tenant: savedTenant,
        subdomainUrl,
        tokens: {
          accessToken,
          refreshToken,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }


}
