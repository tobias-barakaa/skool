// ==================== FORGOT PASSWORD PROVIDER ====================
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Tenant } from 'src/tenants/entities/tenant.entity';
import { UserTenantMembership, MembershipStatus } from 'src/user-tenant-membership/entities/user-tenant-membership.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import jwtConfig from '../config/jwt.config';
import { EmailService } from 'src/email/providers/email.service';
import { ForgotPasswordInput, ResetPasswordInput } from '../dtos/password-reset.dto';
import { HashingProvider } from './hashing.provider';

@Injectable()
export class ForgotPasswordProvider {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    
    @InjectRepository(UserTenantMembership)
    private readonly membershipRepository: Repository<UserTenantMembership>,
    
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
    
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,

    private readonly hashingProvider: HashingProvider
  ) {}

  async sendResetPasswordEmail(forgotPasswordInput: ForgotPasswordInput, subdomain: string): Promise<{ message: string }> {
    // Find tenant by subdomain
    const tenant = await this.tenantRepository.findOne({
      where: { subdomain, isActive: true }
    });

    if (!tenant) {
      throw new NotFoundException('School not found');
    }

    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email: forgotPasswordInput.email }
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return { message: 'If an account with that email exists, you will receive a password reset link......1' };
    }

    // Check if user has membership in this tenant
    const membership = await this.membershipRepository.findOne({
      where: {
        userId: user.id,
        tenantId: tenant.id,
        status: MembershipStatus.ACTIVE
      }
    });

    if (!membership) {
      return { message: 'If an account with that email exists, you will receive a password reset link......2' };
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        tenantId: tenant.id,
        type: 'password_reset'
      },
      {
        secret: this.jwtConfiguration.secret,
        expiresIn: '1h',
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
      }
    );

    // Send reset email
    await this.emailService.sendPasswordResetEmail(
      user.email,
      user.name,
      tenant.name,
      resetToken,
      tenant.id
    );

    return { message: 'If an account with that email exists, you will receive a password reset link....3' };
  }

  async resetPassword(resetPasswordInput: ResetPasswordInput): Promise<{ message: string }> {
    try {
      // Verify reset token
      const payload = await this.jwtService.verifyAsync(resetPasswordInput.token, {
        secret: this.jwtConfiguration.secret,
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
      });

      if (payload.type !== 'password_reset') {
        throw new UnauthorizedException('Invalid reset token');
      }

      // Find user
      const user = await this.userRepository.findOne({
        where: { id: payload.sub, email: payload.email }
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Update password
      const hashedPassword = await this.hashingProvider.hashPassword(resetPasswordInput.newPassword);
      await this.userRepository.update(user.id, { password: hashedPassword });

      return { message: 'Password reset successfully' };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
  }

}
