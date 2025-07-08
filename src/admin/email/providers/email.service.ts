import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Resend } from 'resend';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import { Repository } from 'typeorm';
import resendConfig from '../config/resend.config';

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
        <p>You have been invited by <strong>${invitationToken}</strong>


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

  async sendParentInvitation(
    // email: string,
    // parentName: string,
    // schoolName: string,
    // invitationToken: string,
    // inviterName: string,
    // tenantId: string,
    // studentName: string,

    email: string,
    parentName: string,
    schoolName: string,
    invitationToken: string,
    inviterName: string,
    tenantId: string,
    students: {
      id: string;
      name: string;
      admissionNumber: string;
      grade: string;
    }[],
  ) {
    const subdomain = await this.getTenantSubdomain(tenantId);

    const invitationUrl = `https://${subdomain}.squl.co.ke/signup?token=${invitationToken}`;

    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Welcome to ${schoolName}!</h2>

      <p>Dear ${parentName},</p>

      <p>You have been invited by <strong>${inviterName}</strong> to join <strong>${schoolName}</strong> as a parent of <strong>${students}</strong>.</p>

      <p>As a parent, you will have access to:</p>
      <ul>
        <li>Your child's academic progress and grades</li>
        <li>Fee statements and payment history</li>
        <li>School announcements and communication</li>
        <li>Teacher-parent communication portal</li>
        <li>School calendar and events</li>
      </ul>

      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p><strong>To complete your registration and access your account:</strong></p>
        <ol>
          <li>Click the invitation link below</li>
          <li>Set up your password</li>
          <li>Review and update your profile information</li>
          <li>Start monitoring your child's academic journey</li>
        </ol>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${invitationUrl}"
           style="background-color: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Accept Invitation
        </a>
      </div>

      <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0; color: #2c3e50;">
          <strong>Child Information:</strong><br>
          Student Name: ${students}<br>
          School: ${schoolName}
        </p>
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
      subject: `Invitation to Join ${schoolName} - Parent of ${students}`,
      html: htmlContent,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error('Failed to send email');
    }

    return data;
  }

  async sendStaffInvitation(
    email: string,
    staffName: string,
    schoolName: string,
    invitationToken: string,
    inviterName: string,
    tenantId: string,
    staffRole: string,
  ) {
    const subdomain = await this.getTenantSubdomain(tenantId);

    const invitationUrl = `https://${subdomain}.squl.co.ke/signup?token=${invitationToken}`;

    // Format the role for display
    const formattedRole = staffRole
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());

    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ${schoolName}!</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Staff Invitation</p>
      </div>

      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <p style="font-size: 18px; color: #333; margin-bottom: 20px;">Dear ${staffName},</p>

        <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
          You have been invited by <strong>${inviterName}</strong> to join <strong>${schoolName}</strong> as a <strong>${formattedRole}</strong>.
        </p>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #667eea;">
          <h3 style="color: #333; margin-top: 0; font-size: 16px;">Your Position Details:</h3>
          <ul style="color: #555; margin: 10px 0; padding-left: 20px;">
            <li><strong>Role:</strong> ${formattedRole}</li>
            <li><strong>School:</strong> ${schoolName}</li>
            <li><strong>Invited by:</strong> ${inviterName}</li>
            <li><strong>Invited by:</strong> ${invitationToken}</li>


          </ul>
        </div>

        <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="color: #333; margin-top: 0; font-size: 16px;">Getting Started:</h3>
          <ol style="color: #555; margin: 10px 0; padding-left: 20px; line-height: 1.6;">
            <li>Click the invitation link below to accept</li>
            <li>Create your secure password</li>
            <li>Complete your staff profile</li>
            <li>Access your dashboard and start managing school operations</li>
          </ol>
        </div>

        <div style="text-align: center; margin: 35px 0;">
          <a href="${invitationUrl}"
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 15px 40px;
                    text-decoration: none;
                    border-radius: 25px;
                    display: inline-block;
                    font-weight: bold;
                    font-size: 16px;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                    transition: all 0.3s ease;">
            Accept Invitation & Join Team
          </a>
        </div>

        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 25px 0;">
          <p style="color: #856404; margin: 0; font-size: 14px;">
            <strong>⏰ Important:</strong> This invitation will expire in 7 days. Please accept it as soon as possible.
          </p>
        </div>

        <div style="border-top: 2px solid #f1f3f4; padding-top: 20px; margin-top: 30px;">
          <p style="color: #888; font-size: 14px; margin-bottom: 10px;">
            If you have any questions about your role or need assistance, please contact your school administrator.
          </p>

          <p style="color: #333; margin-bottom: 5px;">
            Best regards,<br>
            <strong>The ${schoolName} Administration Team</strong>
          </p>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    </div>
  `;

    const { data, error } = await this.resend.emails.send({
      from: this.resendConfiguration.fromEmail || 'noreply@squl.co.ke',
      to: email,
      subject: `Welcome to ${schoolName} - Staff Invitation (${formattedRole})`,
      html: htmlContent,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error('Failed to send email33');
    }

    return data;
  }
}
