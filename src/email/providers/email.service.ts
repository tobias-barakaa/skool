import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async sendTeacherInvitation(
    email: string,
    teacherName: string,
    schoolName: string,
    invitationToken: string,
    inviterName: string
  ) {
    const invitationUrl = `${this.configService.get('FRONTEND_URL')}/accept-invitation?token=${invitationToken}`;
    
    const mailOptions = {
      from: this.configService.get('FROM_EMAIL'),
      to: email,
      subject: `Invitation to Join ${schoolName} as a Teacher`,
      html: `
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
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}