// import {
//   BadRequestException,
//   ForbiddenException,
//   Injectable,
//   NotFoundException,
// } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import * as bcrypt from 'bcrypt';
// import * as crypto from 'crypto';
// import { GenerateTokenProvider } from 'src/admin/auth/providers/generate-token.provider';
// import { EmailService } from 'src/admin/email/providers/email.service';
// import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
// import { Equal, In, LessThan, MoreThan, Not, Repository } from 'typeorm';
// import { CreateTeacherInvitationDto } from '../dtos/create-teacher-invitation.dto';
// import { TeacherDto } from '../dtos/teacher-query.dto';
// import { Teacher } from '../entities/teacher.entity';
// import { User } from 'src/admin/users/entities/user.entity';
// import { InvitationStatus, InvitationType, UserInvitation } from 'src/admin/invitation/entities/user-iInvitation.entity';
// import { MembershipRole, MembershipStatus, UserTenantMembership } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
// import { EmailSendFailedException } from 'src/admin/common/exceptions/business.exception';
// import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';

// @Injectable()
// export class TeacherService {
//   constructor(
//     @InjectRepository(Teacher)
//     private readonly teacherRepository: Repository<Teacher>,
//     @InjectRepository(User)
//     private readonly userRepository: Repository<User>,
//     @InjectRepository(UserInvitation)
//     private readonly invitationRepository: Repository<UserInvitation>,
//     @InjectRepository(UserTenantMembership)
//     private readonly membershipRepository: Repository<UserTenantMembership>,
//     @InjectRepository(Tenant)
//     private readonly tenantRepository: Repository<Tenant>,
//     private readonly emailService: EmailService,
//     private readonly generateTokensProvider: GenerateTokenProvider,
//   ) {}

// async acceptInvitation(
//     token: string,
//     password: string,
//   ): Promise<AcceptInvitationResponse> {
//     const invitation = await this.invitationRepo.findOne({
//       where: { token, status: InvitationStatus.PENDING },
//       relations: ['tenant'],
//     });

//     if (!invitation || invitation.expiresAt < new Date()) {
//       throw new BadRequestException('Invalid or expired invitation');
//     }

//     const data = invitation.userData as CreateTeacherInvitationDto;

//     const user = await this.authService.createOrFindUser(
//       invitation.email,
//       data.fullName,
//       password,
//       invitation.tenant.subdomain,
//     );

//     const membership = await this.authService.createMembership(
//       user,
//       invitation.tenant,
//       MembershipRole.TEACHER,
//     );

//     const tokens = await this.authService.issueTokens(
//       user,
//       membership,
//       invitation.tenant,
//     );

//     await this.invitationRepo.update(invitation.id, {
//       status: InvitationStatus.ACCEPTED,
//     });

//     // Link profile
//     const teacher = await this.teacherRepo.findOne({
//       where: { email: invitation.email },
//     });
//     if (teacher) {
//       teacher.userId = user.id;
//       teacher.isActive = true;
//       await this.teacherRepo.save(teacher);
//     }

//     return {
//       message: 'Invitation accepted successfully',
//       user: {
//         id: user.id,
//         email: user.email,
//         name: user.name,
//       },
//       tokens,
//       teacher: teacher ? { id: teacher.id, name: teacher.fullName } : null,
//     };
//   }











  // async inviteTeacher(
  //   createTeacherDto: CreateTeacherInvitationDto,
  //   currentUser: User,
  //   tenantId: string,
  // ) {
  //   // Verify that current user is SCHOOL_ADMIN for this tenant
  //   const membership = await this.membershipRepository.findOne({
  //     where: {
  //       user: { id: currentUser.id },
  //       tenant: { id: tenantId },
  //       role: MembershipRole.SCHOOL_ADMIN,
  //       status: MembershipStatus.ACTIVE,
  //     },
  //   });

  //   if (!membership) {
  //     throw new ForbiddenException('Only SCHOOL_ADMIN can invite teachers');
  //   }

  //   // Check if user with this email already exists in this tenant
  //   const existingUser = await this.userRepository.findOne({
  //     where: { email: createTeacherDto.email },
  //   });

  //   if (existingUser) {
  //     const existingMembership = await this.membershipRepository.findOne({
  //       where: {
  //         user: { id: existingUser.id },
  //         tenant: { id: tenantId },
  //       },
  //     });

  //     if (existingMembership) {
  //       throw new BadRequestException('User already exists in this tenant');
  //     }
  //   }

  //   // Check for recent pending invitation (within last 10 minutes)
  //   const tenMinutesAgo = new Date();
  //   tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);

  //   const recentInvitation = await this.invitationRepository.findOne({
  //     where: {
  //       email: createTeacherDto.email,
  //       tenant: { id: tenantId },
  //       status: InvitationStatus.PENDING,
  //       createdAt: MoreThan(tenMinutesAgo),
  //     },
  //     order: {
  //       createdAt: 'DESC',
  //     },
  //   });

  //   if (recentInvitation) {
  //     throw new BadRequestException(
  //       'An invitation was already sent to this email recently. Please wait 10 minutes before sending another.',
  //     );
  //   }

  //   // Expire old pending invitations for this email and tenant
  //   await this.invitationRepository.update(
  //     {
  //       email: createTeacherDto.email,
  //       tenant: { id: tenantId },
  //       status: InvitationStatus.PENDING,
  //       expiresAt: LessThan(new Date()),
  //     },
  //     {
  //       status: InvitationStatus.EXPIRED,
  //     },
  //   );

  //   // Get tenant info
  //   const tenant = await this.tenantRepository.findOne({
  //     where: { id: tenantId },
  //   });

  //   // Generate invitation token
  //   const token = crypto.randomBytes(32).toString('hex');
  //   const expiresAt = new Date();
  //   expiresAt.setDate(expiresAt.getDate() + 7);

  //   // Create invitation record
  //   const invitation = this.invitationRepository.create({
  //     email: createTeacherDto.email,
  //     role: createTeacherDto.role,
  //     userData: createTeacherDto,
  //     token,
  //     type: InvitationType.TEACHER,
  //     status: InvitationStatus.PENDING,
  //     expiresAt,
  //     invitedBy: currentUser,
  //     tenant: { id: tenantId },
  //   });

  //   await this.invitationRepository.save(invitation);

  //   // Check if teacher record already exists for this email
  //   let teacher = await this.teacherRepository.findOne({
  //     where: { email: createTeacherDto.email },
  //   });

  //   if (!teacher) {
  //     teacher = this.teacherRepository.create({
  //       ...createTeacherDto,
  //       isActive: false,
  //       hasCompletedProfile: false,
  //       tenant: { id: tenantId },
  //     });

  //     await this.teacherRepository.save(teacher);
  //   }

  //   // Send invitation email
  //   try {
  //     await this.emailService.sendTeacherInvitation(
  //       createTeacherDto.email,
  //       createTeacherDto.fullName,
  //       tenant?.name || 'Unknown Tenant',
  //       token,
  //       currentUser.name,
  //       tenantId,
  //     );
  //   } catch (error) {
  //     console.error('[EmailService Error]', error);
  //     throw new EmailSendFailedException(createTeacherDto.email);
  //   }

  //   return {
  //     email: invitation.email,
  //     fullName: teacher.fullName,
  //     status: invitation.status,
  //     createdAt: invitation.createdAt,
  //   };
  // }

// src/invitation/providers/generic-inviter.provider.ts





  // async getTeacherPendingInvitations(
  //   tenantId: string,
  //   currentUser: ActiveUserData,
  // ) {
  //   // Verify admin access
  //   const membership = await this.membershipRepository.findOne({
  //     where: {
  //       user: { id: currentUser.sub },
  //       tenant: { id: tenantId },
  //       role: MembershipRole.SCHOOL_ADMIN,
  //       status: MembershipStatus.ACTIVE,
  //     },
  //   });

  //   if (!membership) {
  //     throw new ForbiddenException('Access denied');
  //   }

  //   return this.invitationRepository.find({
  //     where: {
  //       tenant: { id: tenantId },
  //       status: InvitationStatus.PENDING,
  //     },
  //     relations: ['invitedBy'],
  //     order: { createdAt: 'DESC' },
  //   });
  // }

  // async revokeInvitation(invitationId: string, currentUser: User) {
  //   const invitation = await this.invitationRepository.findOne({
  //     where: { id: invitationId },
  //     relations: ['tenant'],
  //   });

  //   if (!invitation) {
  //     throw new NotFoundException('Invitation not found');
  //   }

  //   // Verify admin access
  //   const membership = await this.membershipRepository.findOne({
  //     where: {
  //       user: { id: currentUser.id },
  //       tenant: { id: invitation.tenant.id },
  //       role: MembershipRole.SCHOOL_ADMIN,
  //       status: MembershipStatus.ACTIVE,
  //     },
  //   });

  //   if (!membership) {
  //     throw new ForbiddenException('Access denied');
  //   }

  //   await this.invitationRepository.update(invitationId, {
  //     status: InvitationStatus.REVOKED,
  //   });

  //   return { message: 'Invitation revoked successfully' };
  // }







  // async getTeacherStats(tenantId: string) {
  //   const [total, active, pendingInvites, recentTeachers] = await Promise.all([
  //     this.teacherRepository.count({ where: { tenantId } }),
  //     this.teacherRepository.count({ where: { tenantId, isActive: true } }),
  //     this.invitationRepository.count({
  //       where: {
  //         tenant: { id: tenantId },
  //         status: InvitationStatus.PENDING,
  //       },
  //     }),
  //     this.teacherRepository.find({
  //       where: { tenantId },
  //       order: { createdAt: 'DESC' },
  //       take: 5,
  //     }),
  //   ]);

  //   return {
  //     total,
  //     active,
  //     pendingInvitations: pendingInvites,
  //     recentlyAdded: recentTeachers.map((t) => ({
  //       id: t.id,
  //       fullName: t.fullName,
  //       email: t.email,
  //       createdAt: t.createdAt,
  //     })),
  //   };
  // }






    // @Mutation(() => AcceptInvitationResponse)
    // @Auth(AuthType.None)
    // async acceptTeacherInvitation(
    //   @Args('acceptInvitationInput', { type: () => AcceptInvitationInput })
    //   input: AcceptInvitationInput,
    //   @Context() context,
    // ): Promise<AcceptInvitationResponse> {
    //   const { message, user, tokens, teacher } =
    //     await this.teacherService.acceptInvitation(input.token, input.password);

    //   context.res.cookie('access_token', tokens.accessToken, {
    //     httpOnly: true,
    //     sameSite: 'None',
    //     secure: process.env.NODE_ENV === 'production',
    //     maxAge: 1000 * 60 * 15,
    //     domain: '.squl.co.ke',
    //   });

    //   context.res.cookie('refresh_token', tokens.refreshToken, {
    //     httpOnly: true,
    //     sameSite: 'None',
    //     secure: process.env.NODE_ENV === 'production',
    //     maxAge: 1000 * 60 * 60 * 24 * 7,
    //     domain: '.squl.co.ke',
    //   });

    //   return {
    //     message,
    //     user,
    //     tokens,
    //     teacher,
    //   };
    // }
