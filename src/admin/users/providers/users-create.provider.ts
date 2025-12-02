import { BadRequestException, ForbiddenException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
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
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { UserInvitation } from 'src/admin/invitation/entities/user-iInvitation.entity';

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



    async adminChangeUserPassword(
  currentUser: ActiveUserData,
  targetUserId: string,
  newPassword: string
): Promise<boolean> {
  const userRepo = this.dataSource.getRepository(User);
  const targetUser = await userRepo.findOne({
    where: { id: targetUserId },
    relations: ['memberships'],
  });

  if (!targetUser) throw new Error('User not found');

  // Tenant check only applies if current user is a School Admin
  if (currentUser.role === MembershipRole.SCHOOL_ADMIN) {
    const isSameTenant = targetUser.memberships.some(
      (m) => m.tenantId === currentUser.tenantId
    );
    if (!isSameTenant)
      throw new Error('Cannot change password for user outside your tenant');
  }

  // Hash the new password
  targetUser.password = await this.hashingProvider.hashPassword(newPassword);
  await userRepo.save(targetUser);

  // Invalidate old tokens
  await this.invalidateTokensForUser(targetUser.id);

  // Optional: log this action
  // await this.auditLogService.log({
  //   performedBy: currentUser.userId,
  //   action: 'ADMIN_CHANGE_PASSWORD',
  //   targetUserId: targetUser.id,
  //   tenantId:
  //     currentUser.role === MembershipRole.SCHOOL_ADMIN
  //       ? currentUser.tenantId
  //       : null, // Super admin may not have a tenant
  // });

  return true;
}

  


  async changePassword(currentUser: ActiveUserData, oldPassword: string, newPassword: string): Promise<boolean> {
    const repo = this.dataSource.getRepository(User);

    const user = await repo.findOne({ where: { id: currentUser.sub }});

    if (!user) throw new NotFoundException("User not found");

  
    const isValid = await this.hashingProvider.comparePassword(oldPassword, user.password);

if (!isValid) throw new BadRequestException("Incorrect old password");


console.log('Old password:', oldPassword);
console.log('Stored hash:', user.password);
console.log('Compare result:', await this.hashingProvider.comparePassword(oldPassword, user.password));

  
    user.password = await this.hashingProvider.hashPassword(newPassword);
    await repo.save(user);
  
    await this.invalidateTokensForUser(currentUser.sub); 
  
    return true;
  }


  private async invalidateTokensForUser(userId: string): Promise<void> {
    const userRepository =  this.dataSource.getRepository(User)
  await userRepository.increment(
    { id: userId },
    'tokenVersion',
    1
  );
} 

// users.service.ts
// users.service.ts
async changeEmail(currentUser: ActiveUserData, newEmail: string): Promise<boolean> {
  const userRepo = this.dataSource.getRepository(User);
  const invitationRepo = this.dataSource.getRepository(UserInvitation);

  // 1. Fetch the current user
  const user = await userRepo.findOne({ where: { id: currentUser.sub } });
  if (!user) throw new NotFoundException('User not found');

  // const oldEmail = user.email;

  // 2. Check if new email already exists
  const existing = await userRepo.findOne({ where: { email: newEmail } });
  if (existing) throw new BadRequestException('Email already in use');

  // 3. Update user's email
  user.email = newEmail;
  await userRepo.save(user);

  // 4. Update invitations sent by this user, if any
  const invitations = await invitationRepo.find({ where: { invitedById: user.id } });
  for (const inv of invitations) {
    inv.email = newEmail;
    await invitationRepo.save(inv);
  }

  // 5. Invalidate all existing tokens
  await userRepo.increment({ id: user.id }, 'tokenVersion', 1);

  // 6. Optional: log the change
  // await this.auditLogService.log({
  //   performedBy: user.id,
  //   action: 'CHANGE_EMAIL',
  //   details: { oldEmail, newEmail },
  // });

  return true;
}




   async adminChangeUserEmail(
      currentUser: ActiveUserData,
      targetUserId: string,
      newEmail: string,
    ): Promise<boolean> {
  const userRepository = this.dataSource.getRepository(User)

      const targetUser = await userRepository.findOne({
        where: { id: targetUserId },
        relations: ['memberships'],
      });
      if (!targetUser) throw new NotFoundException('User not found');
  
      if (currentUser.role === MembershipRole.SCHOOL_ADMIN) {
        const isSameTenant = targetUser.memberships.some(
          (m) => m.tenantId === currentUser.tenantId
        );
        if (!isSameTenant)
          throw new ForbiddenException('Cannot change email for user outside your tenant');
      }
  
      targetUser.email = newEmail;
      await userRepository.save(targetUser);
  
      await this.invalidateTokensForUser(targetUser.id);
  
      // await this.auditLogService.log({
      //   performedBy: currentUser.userId,
      //   action: 'ADMIN_CHANGE_EMAIL',
      //   targetUserId: targetUser.id,
      //   tenantId: currentUser.role === MembershipRole.SCHOOL_ADMIN ? currentUser.tenantId : null,
      // });
  
      return true;
    }

}
