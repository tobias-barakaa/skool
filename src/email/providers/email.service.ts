import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Resend } from 'resend';
import resendConfig from '../config/resend.config';
import { InjectRepository } from '@nestjs/typeorm';
import { Tenant } from 'src/tenants/entities/tenant.entity';
import { Repository } from 'typeorm';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor(
    @Inject(resendConfig.KEY)
    private readonly resendConfiguration: ConfigType<typeof resendConfig>,

    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {
    this.resend = new Resend(this.resendConfiguration.apiKey);

  }

  private async getTenantSubdomain(tenantId: string): Promise<string> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
      select: ['subdomain'],
    });

    if (!tenant) {
      throw new Error(`Tenant with ID ${tenantId} not found`);
    }

    return tenant.subdomain;
  }

  async sendTeacherInvitation(
    email: string,
    teacherName: string,
    schoolName: string,
    invitationToken: string,
    inviterName: string,
    tenantId: string,
  ) {
    const subdomain = await this.getTenantSubdomain(tenantId);

    const invitationUrl = `https://${subdomain}.squl.co.ke/signup?token=${invitationToken}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Welcome to ${schoolName}!</h2>
        
        <p>Dear ${teacherName},</p>
        
        <p>You have been invited by <strong>${inviterName}</strong> to join <strong>${schoolName}</strong> as a teacher.</p>
        
        <p>Your profile has been pre-filled with the following information. You can review and update it after accepting the invitation:</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>To complete your registration and access your account:</strong></p>
          <ol>
            <li>Click the invitation link below</li>
            <li>Set up your password</li>
            <li>Review and update your profile information</li>
            <li>Start using the school management system</li>
          </ol>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${invitationUrl}" 
             style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Accept Invitation
          </a>
        </div>
        
        <p style="color: #7f8c8d; font-size: 14px;">
          This invitation will expire in 7 days. If you have any questions, please contact your school administrator.
        </p>
        
        <p>Best regards,<br>The ${schoolName} Team</p>
      </div>
    `;

    const { data, error } = await this.resend.emails.send({
      from: this.resendConfiguration.fromEmail || 'noreply@squl.co.ke',
      to: email,
      subject: `Invitation to Join ${schoolName} as a Teacher`,
      html: htmlContent,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error('Failed to send email');
    }

    return data;
  }


  async sendPasswordResetEmail(
    email: string,
    userName: string,
    schoolName: string,
    resetToken: string,
    tenantId: string,
  ) {
    const subdomain = await this.getTenantSubdomain(tenantId);
    const resetUrl = `https://${subdomain}.squl.co.ke/reset-password?token=${resetToken}`;
  
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Password Reset Request</h2>
        
        <p>Dear ${userName},</p>
        
        <p>You have requested to reset your password for your <strong>${schoolName}</strong> account.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>To reset your password:</strong></p>
          <ol>
            <li>Click the reset link below</li>
            <li>Enter your new password</li>
            <li>Confirm your new password</li>
            <li>Sign in with your new password</li>
          </ol>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #7f8c8d; font-size: 14px;">
          This link will expire in 1 hour. If you didn't request this password reset, please ignore this email.
          If you continue to have problems, please contact your school administrator.
        </p>
        
        <p>Best regards,<br>The ${schoolName} Team</p>
      </div>
    `;
  
    const { data, error } = await this.resend.emails.send({
      from: this.resendConfiguration.fromEmail || 'noreply@squl.co.ke',
      to: email,
      subject: `Password Reset Request - ${schoolName}`,
      html: htmlContent,
    });
  
    if (error) {
      console.error('Resend error:', error);
      throw new Error('Failed to send password reset email');
    }
  
    return data;
  }
}

