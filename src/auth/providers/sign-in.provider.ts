import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Tenant } from 'src/tenants/entities/tenant.entity';
import { UserTenantMembership, MembershipStatus } from 'src/user-tenant-membership/entities/user-tenant-membership.entity';
import { HashingProvider } from 'src/auth/providers/hashing.provider';
import { GenerateTokenProvider } from 'src/auth/providers/generate-token.provider';
import { AuthResponse, SignInInput } from '../dtos/signin-input.dto';

@Injectable()
export class SignInProvider {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    
    @InjectRepository(UserTenantMembership)
    private readonly membershipRepository: Repository<UserTenantMembership>,
    
    private readonly hashingProvider: HashingProvider,
    private readonly generateTokensProvider: GenerateTokenProvider,
  ) {}


  async signIn(signInInput: SignInInput, subdomain: string): Promise<AuthResponse> {
    console.log(signInInput, 'this is the sign in input..::', subdomain)
    
    // Find tenant by subdomain
    const tenant = await this.tenantRepository.findOne({
      where: { subdomain, isActive: true }
    });
  
    if (!tenant) {
      throw new NotFoundException('School not found or inactive');
    }
  
    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email: signInInput.email },
      relations: ['memberships', 'memberships.tenant']
    });
  
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
  
    // Verify password
    const isPasswordValid = await this.hashingProvider.comparePassword(
      signInInput.password,
      user.password
    );
  
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials 2');
    }
  
    // Check if user has membership in this tenant
    const membership = await this.membershipRepository.findOne({
      where: {
        userId: user.id,
        tenantId: tenant.id,
        status: MembershipStatus.ACTIVE
      },
      relations: ['tenant']
    });
  
    if (!membership) {
      throw new UnauthorizedException('You do not have access to this school');
    }
  
    // Generate tokens with tenant and membership context
    const tokens = await this.generateTokensProvider.generateTokens(user, membership, tenant);
  
    return {
      user,
      membership,
      subdomainUrl: `${tenant.subdomain}.squl.co.ke`,
      tokens
    };
  }


  
  // async signIn(signInInput: SignInInput, subdomain: string): Promise<AuthResponse> {
  //   console.log(signInInput, 'this is the sign in input..::', subdomain)
  //   // Find tenant by subdomain
  //   const tenant = await this.tenantRepository.findOne({
  //     where: { subdomain, isActive: true }
  //   });

  //   if (!tenant) {
  //     throw new NotFoundException('School not found or inactive');
  //   }

  //   // Find user by email
  //   const user = await this.userRepository.findOne({
  //     where: { email: signInInput.email },
  //     relations: ['memberships', 'memberships.tenant']
  //   });

  //   if (!user) {
  //     throw new UnauthorizedException('Invalid credentials');
  //   }

  //   // Verify password
  //   const isPasswordValid = await this.hashingProvider.comparePassword(
  //     signInInput.password,
  //     user.password
  //   );

  //   if (!isPasswordValid) {
  //     throw new UnauthorizedException('Invalid credentials 2');
  //   }

  //   // Check if user has membership in this tenant
  //   const membership = await this.membershipRepository.findOne({
  //     where: {
  //       userId: user.id,
  //       tenantId: tenant.id,
  //       status: MembershipStatus.ACTIVE
  //     },
  //     relations: ['tenant']
  //   });

  //   if (!membership) {
  //     throw new UnauthorizedException('You do not have access to this school');
  //   }

  //   // Generate tokens
  //   const tokens = await this.generateTokensProvider.generateTokens(user);

  //   return {
  //     user,
  //     membership,
  //     subdomainUrl: `${tenant.subdomain}.squl.co.ke`,
  //     tokens
  //   };
  // }
}