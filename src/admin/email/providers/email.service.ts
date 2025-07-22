import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Resend } from 'resend';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import { Repository } from 'typeorm';
import resendConfig from '../config/resend.config';

// Email template interfaces
interface BaseEmailData {
  recipientName: string;
  schoolName: string;
  inviterName?: string;
  tenantId: string;
}

interface TeacherInvitationData extends BaseEmailData {
  email: string;
  invitationToken: string;
}

interface ParentInvitationData extends BaseEmailData {
  email: string;
  invitationToken: string;
  students: {
    id: string;
    name: string;
    admissionNumber: string;
    grade: string;
  }[];
}

interface StaffInvitationData extends BaseEmailData {
  email: string;
  invitationToken: string;
  staffRole: string;
}

interface PasswordResetData {
  email: string;
  userName: string;
  schoolName: string;
  resetToken: string;
  tenantId: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
}

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

  // Base email layout template
  private getBaseEmailTemplate(content: string, schoolName: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ${schoolName}!</h1>
        </div>

        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          ${content}

          <div style="border-top: 2px solid #f1f3f4; padding-top: 20px; margin-top: 30px;">
            <p style="color: #333; margin-bottom: 5px;">
              Best regards,<br>
              <strong>The ${schoolName} Team</strong>
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
  }

  // Common components
  private getInvitationButton(
    url: string,
    text: string,
    color: string = '#667eea',
  ): string {
    return `
      <div style="text-align: center; margin: 35px 0;">
        <a href="${url}"
           style="background: linear-gradient(135deg, ${color} 0%, #764ba2 100%);
                  color: white;
                  padding: 15px 40px;
                  text-decoration: none;
                  border-radius: 25px;
                  display: inline-block;
                  font-weight: bold;
                  font-size: 16px;
                  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                  transition: all 0.3s ease;">
          ${text}
        </a>
      </div>
    `;
  }

  private getExpirationNotice(days: number): string {
    return `
      <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 25px 0;">
        <p style="color: #856404; margin: 0; font-size: 14px;">
          <strong>⏰ Important:</strong> This invitation will expire in ${days} days. Please accept it as soon as possible.
        </p>
      </div>
    `;
  }

  private getInstructionSteps(steps: string[]): string {
    const stepsList = steps.map((step, index) => `<li>${step}</li>`).join('');
    return `
      <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h3 style="color: #333; margin-top: 0; font-size: 16px;">Getting Started:</h3>
        <ol style="color: #555; margin: 10px 0; padding-left: 20px; line-height: 1.6;">
          ${stepsList}
        </ol>
      </div>
    `;
  }

  // Template builders
  private async buildTeacherInvitationTemplate(
    data: TeacherInvitationData,
  ): Promise<EmailTemplate> {
    const subdomain = await this.getTenantSubdomain(data.tenantId);
    const invitationUrl = `https://${subdomain}.squl.co.ke/signup?token=${data.invitationToken}`;

    const steps = [
      'Click the invitation link below to accept',
      'Set up your password',
      'Review and update your profile information',
      'Start using the school management system',
    ];

    const content = `
      <p style="font-size: 18px; color: #333; margin-bottom: 20px;">Dear ${data.recipientName},</p>

      <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
        You have been invited by <strong>${data.inviterName}</strong> to join <strong>${data.schoolName}</strong> as a teacher.
       ${data.invitationToken}

      </p>

      ${this.getInstructionSteps(steps)}
      ${this.getInvitationButton(invitationUrl, 'Accept Teacher Invitation')}
      ${this.getExpirationNotice(7)}
    `;

    return {
      subject: `Invitation to Join ${data.schoolName} as a Teacher`,
      html: this.getBaseEmailTemplate(content, data.schoolName),
    };
  }

  private async buildParentInvitationTemplate(
    data: ParentInvitationData,
  ): Promise<EmailTemplate> {
    const subdomain = await this.getTenantSubdomain(data.tenantId);
    const invitationUrl = `https://${subdomain}.squl.co.ke/signup?token=${data.invitationToken}`;

    const studentNames = data.students.map((s) => s.name).join(', ');
    const studentDetails = data.students
      .map(
        (s) =>
          `<li><strong>${s.name}</strong> (Grade: ${s.grade}, Admission: ${s.admissionNumber})</li>`,
      )
      .join('');

    const steps = [
      'Click the invitation link below',
      'Set up your password',
      'Review and update your profile information',
      "Start monitoring your child's academic journey",
    ];

    const parentFeatures = [
      "Your child's academic progress and grades",
      'Fee statements and payment history',
      'School announcements and communication',
      'Teacher-parent communication portal',
      'School calendar and events',
    ];

    const content = `
      <p style="font-size: 18px; color: #333; margin-bottom: 20px;">Dear ${data.recipientName},</p>

      <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
        You have been invited by <strong>${data.inviterName}</strong> to join <strong>${data.schoolName}</strong> as a parent.
      </p>

      <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h3 style="color: #333; margin-top: 0; font-size: 16px;">Your Child(ren):</h3>
        <ul style="color: #555; margin: 10px 0; padding-left: 20px;">
          ${studentDetails}
        </ul>
      </div>

      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h3 style="color: #333; margin-top: 0; font-size: 16px;">As a parent, you will have access to:</h3>
        <ul style="color: #555; margin: 10px 0; padding-left: 20px;">
          ${parentFeatures.map((feature) => `<li>${feature}</li>`).join('')}
        </ul>
      </div>

      ${this.getInstructionSteps(steps)}
      ${this.getInvitationButton(invitationUrl, 'Accept Parent Invitation', '#27ae60')}
      ${this.getExpirationNotice(7)}
    `;

    return {
      subject: `Invitation to Join ${data.schoolName} - Parent of ${studentNames}`,
      html: this.getBaseEmailTemplate(content, data.schoolName),
    };
  }

  private async buildStaffInvitationTemplate(
    data: StaffInvitationData,
  ): Promise<EmailTemplate> {
    const subdomain = await this.getTenantSubdomain(data.tenantId);
    const invitationUrl = `https://${subdomain}.squl.co.ke/signup?token=${data.invitationToken}`;

   const formattedRole = data.staffRole
     ? data.staffRole
         .replace(/_/g, ' ')
         .toLowerCase()
         .replace(/\b\w/g, (l) => l.toUpperCase())
     : 'Staff Member';

    const steps = [
      'Click the invitation link below to accept',
      'Create your secure password',
      'Complete your staff profile',
      'Access your dashboard and start managing school operations',
    ];

    const content = `
      <p style="font-size: 18px; color: #333; margin-bottom: 20px;">Dear ${data.recipientName},</p>

      <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
        You have been invited by <strong>${data.inviterName}</strong> to join <strong>${data.schoolName}</strong> as a <strong>${formattedRole}</strong>.
      </p>

      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #667eea;">
        <h3 style="color: #333; margin-top: 0; font-size: 16px;">Your Position Details:</h3>
        <ul style="color: #555; margin: 10px 0; padding-left: 20px;">
          <li><strong>Role:</strong> ${formattedRole}</li>
          <li><strong>School:</strong> ${data.schoolName}</li>
          <li><strong>Invited by:</strong> ${data.inviterName}</li>
        </ul>
      </div>

      ${this.getInstructionSteps(steps)}
      ${this.getInvitationButton(invitationUrl, 'Accept Invitation & Join Team')}
      ${this.getExpirationNotice(7)}
    `;

    return {
      subject: `Welcome to ${data.schoolName} - Staff Invitation (${formattedRole})`,
      html: this.getBaseEmailTemplate(content, data.schoolName),
    };
  }

  private async buildPasswordResetTemplate(
    data: PasswordResetData,
  ): Promise<EmailTemplate> {
    const subdomain = await this.getTenantSubdomain(data.tenantId);
    const resetUrl = `https://${subdomain}.squl.co.ke/reset-password?token=${data.resetToken}`;

    const steps = [
      'Click the reset link below',
      'Enter your new password',
      'Confirm your new password',
      'Sign in with your new password',
    ];

    const content = `
      <div style="background: #f8f9fa; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
        <h2 style="color: #2c3e50; margin: 0;">Password Reset Request</h2>
      </div>

      <div style="padding: 20px;">
        <p style="font-size: 18px; color: #333; margin-bottom: 20px;">Dear ${data.userName},</p>

        <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
          You have requested to reset your password for your <strong>${data.schoolName}</strong> account.
        </p>

        ${this.getInstructionSteps(steps)}
        ${this.getInvitationButton(resetUrl, 'Reset Password', '#e74c3c')}

        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 25px 0;">
          <p style="color: #856404; margin: 0; font-size: 14px;">
            <strong>⏰ Important:</strong> This link will expire in 1 hour. If you didn't request this password reset, please ignore this email.
          </p>
        </div>
      </div>
    `;

    return {
      subject: `Password Reset Request - ${data.schoolName}`,
      html: content,
    };
  }



  // Generic email sender
  private async sendEmail(to: string, template: EmailTemplate): Promise<any> {
    const { data, error } = await this.resend.emails.send({
      from: this.resendConfiguration.fromEmail || 'noreply@squl.co.ke',
      to,
      subject: template.subject,
      html: template.html,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error('Failed to send email');
    }

    return data;
  }

  // Public methods - now much cleaner
  async sendTeacherInvitation(
    email: string,
    teacherName: string,
    schoolName: string,
    invitationToken: string,
    inviterName: string,
    tenantId: string,
  ) {
    const template = await this.buildTeacherInvitationTemplate({
      email,
      recipientName: teacherName,
      schoolName,
      invitationToken,
      inviterName,
      tenantId,
    });

    return this.sendEmail(email, template);
  }

  async sendParentInvitation(
    email: string,
    parentName: string,
    schoolName: string,
    invitationToken: string,
    tenantId: string,
    students: {
      id: string;
      name: string;
      admissionNumber: string;
      grade: string;
    }[],
  ) {
    const template = await this.buildParentInvitationTemplate({
      email,
      recipientName: parentName,
      schoolName,
      invitationToken,
      tenantId,
      students,
    });

    return this.sendEmail(email, template);
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
    const template = await this.buildStaffInvitationTemplate({
      email,
      recipientName: staffName,
      schoolName,
      invitationToken,
      inviterName,
      tenantId,
      staffRole,
    });

    return this.sendEmail(email, template);
  }

  async sendPasswordResetEmail(
    email: string,
    userName: string,
    schoolName: string,
    resetToken: string,
    tenantId: string,
  ) {
    const template = await this.buildPasswordResetTemplate({
      email,
      userName,
      schoolName,
      resetToken,
      tenantId,
    });

    return this.sendEmail(email, template);
  }
}
