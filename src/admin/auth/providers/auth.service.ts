import { Injectable } from '@nestjs/common';
import { HashingProvider } from './hashing.provider';
import { GenerateTokenProvider } from './generate-token.provider';
import { Repository } from 'typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { MembershipRole, MembershipStatus, UserTenantMembership } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingProvider: HashingProvider,
    private readonly tokenProvider: GenerateTokenProvider,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(UserTenantMembership)
    private readonly membershipRepo: Repository<UserTenantMembership>,
  ) {}
  async createOrFindUser(
    email: string,
    name: string,
    password: string,
    schoolUrl: string,
  ) {
    let user = await this.userRepo.findOne({ where: { email } });

    if (!user) {
      const hashedPassword = await this.hashingProvider.hashPassword(password);
      user = this.userRepo.create({
        email,
        password: hashedPassword,
        name,
        schoolUrl,
      });
      user = await this.userRepo.save(user);
    }

    return user;
  }

  async createMembership(user: User, tenant: Tenant, role: MembershipRole) {
    const membership = this.membershipRepo.create({
      user,
      tenant,
      role,
      status: MembershipStatus.ACTIVE,
      joinedAt: new Date(),
    });

    return this.membershipRepo.save(membership);
  }

  async issueTokens(
    user: User,
    membership: UserTenantMembership,
    tenant: Tenant,
  ) {
    return this.tokenProvider.generateTokens(user, membership, tenant);
  }
}
