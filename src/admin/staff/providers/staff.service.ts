import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { GenerateTokenProvider } from 'src/admin/auth/providers/generate-token.provider';
import { EmailService } from 'src/admin/email/providers/email.service';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import { Equal, In, LessThan, MoreThan, Not, Repository } from 'typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import {
  InvitationStatus,
  InvitationType,
  UserInvitation,
} from 'src/admin/invitation/entities/user-iInvitation.entity';
import {
  MembershipRole,
  MembershipStatus,
  UserTenantMembership,
} from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { EmailSendFailedException } from 'src/admin/common/exceptions/business.exception';
import { Staff, StaffStatus } from '../entities/staff.entity';
import {
  AcceptStaffInvitationInput,
  AcceptStaffInvitationResponse,
  CreateStaffInvitationDto,
  InviteStaffResponse,
  StaffDto,
  UpdateStaffInput,
} from '../dtos/create-staff-invitation.dto';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { UsersService } from 'src/admin/users/providers/users.service';
import { InvitationService } from 'src/admin/invitation/providers/invitation.service';


@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserInvitation)
    private readonly invitationRepository: Repository<UserInvitation>,
    @InjectRepository(UserTenantMembership)
    private readonly membershipRepository: Repository<UserTenantMembership>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly emailService: EmailService,
    private readonly generateTokensProvider: GenerateTokenProvider,
    private readonly invitationService: InvitationService,

  ) {}

  async inviteStaff(
    createStaffDto: CreateStaffInvitationDto,
    currentUser: ActiveUserData,
  ): Promise<InviteStaffResponse> {
    const tenantId = currentUser.tenantId;

    await this.validateMembershipAccess(
      currentUser.sub,
      tenantId,
      [MembershipRole.SCHOOL_ADMIN]
    );

    await this.checkIfUserAlreadyInTenant(
      createStaffDto.email,
      tenantId
    );

    const tenant = await this.tenantRepository.findOneOrFail({
      where: { id: tenantId },
    });

    const existingInvitation = await this.handleInvitationResendLogic(
      createStaffDto.email,
      tenantId
    );

    const { token, expiresAt } = this.createInvitationToken();
    let invitationToSave: UserInvitation;
    const isResend = !!existingInvitation;

    if (isResend) {
      console.log(`Resending staff invitation to ${createStaffDto.email}`);

      existingInvitation.token = token;
      existingInvitation.expiresAt = expiresAt;
      existingInvitation.status = InvitationStatus.PENDING;
      existingInvitation.userData = createStaffDto;
      existingInvitation.lastSentAt = new Date();

      invitationToSave = existingInvitation;
    } else {
      console.log(`Sending a new staff invitation to ${createStaffDto.email}`);

      invitationToSave = this.invitationRepository.create({
        email: createStaffDto.email,
        name: createStaffDto.fullName,
        role: createStaffDto.roleType,
        userData: createStaffDto,
        token,
        type: InvitationType.STAFF,
        status: InvitationStatus.PENDING,
        expiresAt,
        lastSentAt: new Date(),
        invitedBy: { id: currentUser.sub } as User,
        tenant: { id: tenantId },
      });

      await this.createStaffProfile(createStaffDto, tenantId);
    }

    const savedInvitation = await this.invitationRepository.save(invitationToSave);

    await this.emailService.sendStaffInvitation(
      createStaffDto.email,
      createStaffDto.fullName,
      tenant.name,
      token,
      currentUser.sub,
      tenantId,
      InvitationType.STAFF,
      
    );

    return {
      email: savedInvitation.email,
      fullName: createStaffDto.fullName,
      status: savedInvitation.status,
      createdAt: savedInvitation.createdAt,
    };
  }

  private async createStaffProfile(
    createStaffDto: CreateStaffInvitationDto,
    tenantId: string,
  ): Promise<void> {
    const existing = await this.staffRepository.findOne({
      where: { email: createStaffDto.email, tenantId },
    });

    if (existing) {
      console.log('Staff record already exists for email:', createStaffDto.email);
      return;
    }

    const staff = this.staffRepository.create({
      ...createStaffDto,
      role: MembershipRole.STAFF,
      status: StaffStatus.INACTIVE, 
      isActive: false,
      hasCompletedProfile: false,
      tenantId,
      tenant: { id: tenantId },
    });

    await this.staffRepository.save(staff);
    console.log('Created staff profile for:', createStaffDto.email);
  }

  private async validateMembershipAccess(
    userId: string,
    tenantId: string,
    allowedRoles: MembershipRole[],
  ): Promise<void> {
    const membership = await this.membershipRepository.findOne({
      where: {
        user: { id: userId },
        tenant: { id: tenantId },
        role: In(allowedRoles),
      },
    });
  
    if (!membership) {
      throw new BadRequestException(
        'You do not have permission to invite staff members',
      );
    }
  }

  private async checkIfUserAlreadyInTenant(
    email: string,
    tenantId: string,
  ): Promise<void> {
    const existingUser = await this.userRepository.findOne({
      where: { email },
      relations: ['memberships', 'memberships.tenant'],
    });

    if (existingUser) {
      const existingMembership = existingUser.memberships?.find(
        (membership) => membership.tenant.id === tenantId
      );

      if (existingMembership) {
        throw new ConflictException(
          'User is already a member of this organization'
        );
      }
    }
  }

  private readonly RESEND_WINDOW_MIN = 10;

private async handleInvitationResendLogic(
  email: string,
  tenantId: string,
): Promise<UserInvitation | null> {
  const existing = await this.invitationRepository.findOne({
    where: { email, tenantId, type: InvitationType.STAFF },
  });
  if (!existing) return null;

  const nextAllowed = new Date(
    existing.lastSentAt.getTime() + this.RESEND_WINDOW_MIN * 60_000,
  );
  const now = new Date();

  if (nextAllowed > now) {
    const remainingMin = Math.ceil((nextAllowed.getTime() - now.getTime()) / 60000);
    throw new BadRequestException(
      `Invitation already sent. Please wait ${remainingMin} minute${
        remainingMin === 1 ? '' : 's'
      } before requesting a new one.`,
    );
  }
  return existing;
}



  private createInvitationToken(): { token: string; expiresAt: Date } {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); 
    return { token, expiresAt };
  }

    


  async acceptInvitation(
    token: string,
    password: string,
  ): Promise<AcceptStaffInvitationResponse> {
    const result = await this.invitationService.acceptInvitation(
      token,
      password,
      async (user: User, invitation: UserInvitation) => {
        await this.staffRepository.update(
          { email: invitation.email },
          {
            isActive: true,
            hasCompletedProfile: true,
            userId: user.id,
          },
        );
      },
    );

    const staff = await this.staffRepository.findOne({
      where: { email: result.user.email },
    });

    return {
      message: result.message,
      user: result.user,
      tokens: result.tokens,
      staff: staff
        ? {
            id: staff.id,
            name: staff.fullName,
            role: staff.role, // Ensure the role is included
          }
        : undefined,
      invitation: result.invitation,
      role: result.role,
    };
  }
  

  async getAllStaff(tenantId: string): Promise<StaffDto[]> {
    const staff = await this.staffRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });

    return staff.map(s => ({
      id: s.id,
      fullName: s.fullName,
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      phoneNumber: s.phoneNumber,
      gender: s.gender,
      role: s.roleType,
      status: s.status,
      employeeId: s.employeeId,
      nationalId: s.nationalId,
      dateOfBirth: s.dateOfBirth,
      dateOfJoining: s.dateOfJoining,
      address: s.address,
      emergencyContact: s.emergencyContact,
      emergencyContactPhone: s.emergencyContactPhone,
      salary: s.salary,
      bankAccount: s.bankAccount,
      bankName: s.bankName,
      department: s.department,
      supervisor: s.supervisor,
      jobDescription: s.jobDescription,
      qualifications: s.qualifications,
      workExperience: s.workExperience,
      isActive: s.isActive,
      hasCompletedProfile: s.hasCompletedProfile,
      userId: s.userId,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
  }

  async getStaffById(id: string, tenantId: string): Promise<StaffDto> {
    const staff = await this.staffRepository.findOne({
      where: { id, tenantId },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    return {
      id: staff.id,
      fullName: staff.fullName,
      firstName: staff.firstName,
      lastName: staff.lastName,
      email: staff.email,
      phoneNumber: staff.phoneNumber,
      gender: staff.gender,
      role: staff.roleType,
      status: staff.status,
      employeeId: staff.employeeId,
      nationalId: staff.nationalId,
      dateOfBirth: staff.dateOfBirth,
      dateOfJoining: staff.dateOfJoining,
      address: staff.address,
      emergencyContact: staff.emergencyContact,
      emergencyContactPhone: staff.emergencyContactPhone,
      salary: staff.salary,
      bankAccount: staff.bankAccount,
      bankName: staff.bankName,
      department: staff.department,
      supervisor: staff.supervisor,
      jobDescription: staff.jobDescription,
      qualifications: staff.qualifications,
      workExperience: staff.workExperience,
      isActive: staff.isActive,
      hasCompletedProfile: staff.hasCompletedProfile,
      userId: staff.userId,
      createdAt: staff.createdAt,
      updatedAt: staff.updatedAt,
    };
  }

  async updateStaff(
    updateInput: UpdateStaffInput,
    tenantId: string,
  ): Promise<StaffDto> {
    const staff = await this.staffRepository.findOne({
      where: { id: updateInput.id, tenantId },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    Object.assign(staff, {
      ...updateInput,
      id: undefined, 
    });

    const updatedStaff = await this.staffRepository.save(staff);

    return this.getStaffById(updatedStaff.id, tenantId);
  }

  async deleteStaff(id: string, tenantId: string): Promise<boolean> {
    const staff = await this.staffRepository.findOne({
      where: { id, tenantId },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    await this.staffRepository.remove(staff);
    return true;
  }
}

// @Injectable()
// export class StaffService {
//   constructor(
//     @InjectRepository(Staff)
//     private readonly staffRepository: Repository<Staff>,
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
//     private readonly invitationService: InvitationService,
//   ) {}


//   async inviteStaff(
//     createStaffDto: CreateStaffInvitationDto,
//     currentUser: ActiveUserData,
//     tenantId: string,
//   ) {
//     return this.invitationService.inviteUser(
//       currentUser,
//       tenantId,
//       createStaffDto,
//       InvitationType.STAFF,
//       this.emailService.sendStaffInvitation.bind(this.emailService),
//       async () => {
//         // Check if staff record already exists for this email
//         const existing = await this.staffRepository.findOne({
//           where: { email: createStaffDto.email },
//         });

//         if (existing) return;

//         console.log(existing, 'existing email......................./////////////////////:')

//         // 👇 Save roleType to staff table
//         const staff = this.staffRepository.create({
//           ...createStaffDto,
//           role: MembershipRole.STAFF, // Save for display
//           isActive: false,
//           hasCompletedProfile: false,
//           tenant: { id: tenantId },
//         });

//         await this.staffRepository.save(staff);
//       },
//     );
//   }

//   async acceptInvitation(
//     token: string,
//     password: string,
//   ): Promise<AcceptStaffInvitationResponse> {
//     const result = await this.invitationService.acceptInvitation(
//       token,
//       password,
//       async (user: User, invitation: UserInvitation) => {
//         await this.staffRepository.update(
//           { email: invitation.email },
//           {
//             isActive: true,
//             hasCompletedProfile: true,
//             userId: user.id,
//           },
//         );
//       },
//     );

//     const staff = await this.staffRepository.findOne({
//       where: { email: result.user.email },
//     });

//     return {
//       message: result.message,
//       user: result.user,
//       tokens: result.tokens,
//       staff: staff
//         ? {
//             id: staff.id,
//             name: staff.fullName,
//             role: staff.role, // Ensure the role is included
//           }
//         : undefined,
//       invitation: result.invitation,
//       role: result.role,
//     };
//   }

//   async getStaffByTenant(tenantId: string): Promise<StaffDto[]> {
//     const staff = await this.staffRepository.find({
//       where: {
//         tenantId,
//         isActive: true,
//       },
//       order: {
//         createdAt: 'DESC',
//       },
//     });

//     return staff.map((staffMember) => ({
//       id: staffMember.id,
//       fullName: staffMember.fullName,
//       firstName: staffMember.firstName,
//       lastName: staffMember.lastName,
//       email: staffMember.email,
//       phoneNumber: staffMember.phoneNumber,
//       gender: staffMember.gender,
//       role: staffMember.role,
//       status: staffMember.status,
//       employeeId: staffMember.employeeId,
//       nationalId: staffMember.nationalId,
//       dateOfBirth: staffMember.dateOfBirth
//         ? new Date(staffMember.dateOfBirth)
//         : undefined,
//       dateOfJoining: staffMember.dateOfJoining
//         ? new Date(staffMember.dateOfJoining)
//         : undefined,
//       address: staffMember.address,
//       emergencyContact: staffMember.emergencyContact,
//       emergencyContactPhone: staffMember.emergencyContactPhone,
//       salary: staffMember.salary,
//       bankAccount: staffMember.bankAccount,
//       bankName: staffMember.bankName,
//       department: staffMember.department,
//       supervisor: staffMember.supervisor,
//       jobDescription: staffMember.jobDescription,
//       qualifications: staffMember.qualifications,
//       workExperience: staffMember.workExperience,
//       isActive: staffMember.isActive,
//       hasCompletedProfile: staffMember.hasCompletedProfile,
//       userId: staffMember.userId,
//       createdAt: staffMember.createdAt,
//       updatedAt: staffMember.updatedAt,
//     }));
//   }

//   async getStaffById(id: string, tenantId: string): Promise<StaffDto> {
//     const staff = await this.staffRepository.findOne({
//       where: { id, tenantId },
//     });

//     if (!staff) {
//       throw new NotFoundException('Staff member not found');
//     }

//     return {
//       id: staff.id,
//       fullName: staff.fullName,
//       firstName: staff.firstName,
//       lastName: staff.lastName,
//       email: staff.email,
//       phoneNumber: staff.phoneNumber,
//       gender: staff.gender,
//       role: staff.role,
//       status: staff.status,
//       employeeId: staff.employeeId,
//       nationalId: staff.nationalId,
//       dateOfBirth: staff.dateOfBirth ? new Date(staff.dateOfBirth) : undefined,
//       dateOfJoining: staff.dateOfJoining
//         ? new Date(staff.dateOfJoining)
//         : undefined,
//       address: staff.address,
//       emergencyContact: staff.emergencyContact,
//       emergencyContactPhone: staff.emergencyContactPhone,
//       salary: staff.salary,
//       bankAccount: staff.bankAccount,
//       bankName: staff.bankName,
//       department: staff.department,
//       supervisor: staff.supervisor,
//       jobDescription: staff.jobDescription,
//       qualifications: staff.qualifications,
//       workExperience: staff.workExperience,
//       isActive: staff.isActive,
//       hasCompletedProfile: staff.hasCompletedProfile,
//       userId: staff.userId,
//       createdAt: staff.createdAt,
//       updatedAt: staff.updatedAt,
//     };
//   }

//   async updateStaff(
//     updateStaffInput: UpdateStaffInput,
//     currentUser: User,
//     tenantId: string,
//   ) {
//     // Verify admin access
//     const membership = await this.membershipRepository.findOne({
//       where: {
//         user: { id: currentUser.id },
//         tenant: { id: tenantId },
//         role: MembershipRole.SCHOOL_ADMIN,
//         status: MembershipStatus.ACTIVE,
//       },
//     });

//     if (!membership) {
//       throw new ForbiddenException(
//         'Only SCHOOL_ADMIN can update staff members',
//       );
//     }

//     const staff = await this.staffRepository.findOne({
//       where: { id: updateStaffInput.id, tenantId },
//     });

//     if (!staff) {
//       throw new NotFoundException('Staff member not found');
//     }

//     Object.assign(staff, updateStaffInput);
//     await this.staffRepository.save(staff);

//     return this.getStaffById(staff.id, tenantId);
//   }

//   async deleteStaff(id: string, currentUser: User, tenantId: string) {
//     // Step 1: Verify admin access
//     const membership = await this.membershipRepository.findOne({
//       where: {
//         user: { id: currentUser.id },
//         tenant: { id: tenantId },
//         role: MembershipRole.SCHOOL_ADMIN,
//         status: MembershipStatus.ACTIVE,
//       },
//     });

//     if (!membership) {
//       throw new ForbiddenException(
//         'Only SCHOOL_ADMIN can delete staff members',
//       );
//     }

//     // Step 2: Find the staff
//     const staff = await this.staffRepository.findOne({
//       where: { id, tenantId },
//       relations: ['tenant'],
//     });

//     if (!staff) {
//       throw new NotFoundException('Staff member not found');
//     }

//     // Step 3: Delete staff's membership for this tenant
//     if (staff.userId) {
//       await this.membershipRepository.delete({
//         user: { id: staff.userId },
//         tenant: { id: tenantId },
//       });

//       // Step 4: Check if user belongs to other tenants
//       const otherMemberships = await this.membershipRepository.find({
//         where: {
//           user: { id: staff.userId },
//           tenant: Not(Equal(tenantId)),
//         },
//       });

//       // Step 5: Only delete the user if no other memberships
//       if (otherMemberships.length === 0) {
//         await this.userRepository.delete({ id: staff.userId });
//       }
//     }

//     // Step 6: Delete staff record
//     await this.staffRepository.delete({ id, tenantId });

//     return {
//       message:
//         'Staff member, membership, and user (if orphaned) deleted successfully',
//     };
//   }

//   async getPendingInvitations(tenantId: string, currentUser: User) {
//     // Verify admin access
//     const membership = await this.membershipRepository.findOne({
//       where: {
//         user: { id: currentUser.id },
//         tenant: { id: tenantId },
//         role: MembershipRole.SCHOOL_ADMIN,
//         status: MembershipStatus.ACTIVE,
//       },
//     });

//     if (!membership) {
//       throw new ForbiddenException('Access denied');
//     }

//     return this.invitationRepository.find({
//       where: {
//         tenant: { id: tenantId },
//         status: InvitationStatus.PENDING,
//         type: InvitationType.STAFF,
//       },
//       relations: ['invitedBy'],
//       order: { createdAt: 'DESC' },
//     });
//   }

//   async revokeInvitation(invitationId: string, currentUser: User) {
//     const invitation = await this.invitationRepository.findOne({
//       where: { id: invitationId },
//       relations: ['tenant'],
//     });

//     if (!invitation) {
//       throw new NotFoundException('Invitation not found');
//     }

//     // Verify admin access
//     const membership = await this.membershipRepository.findOne({
//       where: {
//         user: { id: currentUser.id },
//         tenant: { id: invitation.tenant.id },
//         role: MembershipRole.SCHOOL_ADMIN,
//         status: MembershipStatus.ACTIVE,
//       },
//     });

//     if (!membership) {
//       throw new ForbiddenException('Access denied');
//     }

//     await this.invitationRepository.update(invitationId, {
//       status: InvitationStatus.REVOKED,
//     });

//     return { message: 'Invitation revoked successfully' };
//   }

//   async getStaffByRole(role: string, tenantId: string): Promise<StaffDto[]> {
//     const staff = await this.staffRepository.find({
//       where: {
//         tenantId,
//         role: role as any,
//         isActive: true,
//       },
//       order: {
//         fullName: 'ASC',
//       },
//     });

//     return staff.map((staffMember) => ({
//       id: staffMember.id,
//       fullName: staffMember.fullName,
//       firstName: staffMember.firstName,
//       lastName: staffMember.lastName,
//       email: staffMember.email,
//       phoneNumber: staffMember.phoneNumber,
//       gender: staffMember.gender,
//       role: staffMember.role,
//       status: staffMember.status,
//       employeeId: staffMember.employeeId,
//       nationalId: staffMember.nationalId,
//       dateOfBirth: staffMember.dateOfBirth
//         ? new Date(staffMember.dateOfBirth)
//         : undefined,
//       dateOfJoining: staffMember.dateOfJoining
//         ? new Date(staffMember.dateOfJoining)
//         : undefined,
//       address: staffMember.address,
//       emergencyContact: staffMember.emergencyContact,
//       emergencyContactPhone: staffMember.emergencyContactPhone,
//       salary: staffMember.salary,
//       bankAccount: staffMember.bankAccount,
//       bankName: staffMember.bankName,
//       department: staffMember.department,
//       supervisor: staffMember.supervisor,
//       jobDescription: staffMember.jobDescription,
//       qualifications: staffMember.qualifications,
//       workExperience: staffMember.workExperience,
//       isActive: staffMember.isActive,
//       hasCompletedProfile: staffMember.hasCompletedProfile,
//       userId: staffMember.userId,
//       createdAt: staffMember.createdAt,
//       updatedAt: staffMember.updatedAt,
//     }));
//   }

//   async getActiveStaffByTenant(tenantId: string): Promise<StaffDto[]> {
//     const staff = await this.staffRepository.find({
//       where: {
//         tenantId,
//         isActive: true,
//         status: StaffStatus.ACTIVE,
//       },
//       order: {
//         fullName: 'ASC',
//       },
//     });

//     return staff.map((staffMember) => ({
//       id: staffMember.id,
//       fullName: staffMember.fullName,
//       firstName: staffMember.firstName,
//       lastName: staffMember.lastName,
//       email: staffMember.email,
//       phoneNumber: staffMember.phoneNumber,
//       gender: staffMember.gender,
//       role: staffMember.role,
//       status: staffMember.status,
//       employeeId: staffMember.employeeId,
//       nationalId: staffMember.nationalId,
//       dateOfBirth: staffMember.dateOfBirth
//         ? new Date(staffMember.dateOfBirth)
//         : undefined,
//       dateOfJoining: staffMember.dateOfJoining
//         ? new Date(staffMember.dateOfJoining)
//         : undefined,
//       address: staffMember.address,
//       emergencyContact: staffMember.emergencyContact,
//       emergencyContactPhone: staffMember.emergencyContactPhone,
//       salary: staffMember.salary,
//       bankAccount: staffMember.bankAccount,
//       bankName: staffMember.bankName,
//       department: staffMember.department,
//       supervisor: staffMember.supervisor,
//       jobDescription: staffMember.jobDescription,
//       qualifications: staffMember.qualifications,
//       workExperience: staffMember.workExperience,
//       isActive: staffMember.isActive,
//       hasCompletedProfile: staffMember.hasCompletedProfile,
//       userId: staffMember.userId,
//       createdAt: staffMember.createdAt,
//       updatedAt: staffMember.updatedAt,
//     }));
//   }

//   async getStaffByDepartment(
//     department: string,
//     tenantId: string,
//   ): Promise<StaffDto[]> {
//     const staff = await this.staffRepository.find({
//       where: {
//         tenantId,
//         department,
//         isActive: true,
//       },
//       order: {
//         fullName: 'ASC',
//       },
//     });

//     return staff.map((staffMember) => ({
//       id: staffMember.id,
//       fullName: staffMember.fullName,
//       firstName: staffMember.firstName,
//       lastName: staffMember.lastName,
//       email: staffMember.email,
//       phoneNumber: staffMember.phoneNumber,
//       gender: staffMember.gender,
//       role: staffMember.role,
//       status: staffMember.status,
//       employeeId: staffMember.employeeId,
//       nationalId: staffMember.nationalId,
//       dateOfBirth: staffMember.dateOfBirth
//         ? new Date(staffMember.dateOfBirth)
//         : undefined,
//       dateOfJoining: staffMember.dateOfJoining
//         ? new Date(staffMember.dateOfJoining)
//         : undefined,
//       address: staffMember.address,
//       emergencyContact: staffMember.emergencyContact,
//       emergencyContactPhone: staffMember.emergencyContactPhone,
//       salary: staffMember.salary,
//       bankAccount: staffMember.bankAccount,
//       bankName: staffMember.bankName,
//       department: staffMember.department,
//       supervisor: staffMember.supervisor,
//       jobDescription: staffMember.jobDescription,
//       qualifications: staffMember.qualifications,
//       workExperience: staffMember.workExperience,
//       isActive: staffMember.isActive,
//       hasCompletedProfile: staffMember.hasCompletedProfile,
//       userId: staffMember.userId,
//       createdAt: staffMember.createdAt,
//       updatedAt: staffMember.updatedAt,
//     }));
//   }

//   async getStaffCount(tenantId: string): Promise<number> {
//     return await this.staffRepository.count({
//       where: {
//         tenantId,
//         isActive: true,
//       },
//     });
//   }

//   async searchStaff(searchTerm: string, tenantId: string): Promise<StaffDto[]> {
//     const staff = await this.staffRepository
//       .createQueryBuilder('staff')
//       .where('staff.tenantId = :tenantId', { tenantId })
//       .andWhere('staff.isActive = :isActive', { isActive: true })
//       .andWhere(
//         '(staff.fullName ILIKE :searchTerm OR staff.email ILIKE :searchTerm OR staff.employeeId ILIKE :searchTerm OR staff.department ILIKE :searchTerm)',
//         { searchTerm: `%${searchTerm}%` },
//       )
//       .orderBy('staff.fullName', 'ASC')
//       .getMany();

//     return staff.map((staffMember) => ({
//       id: staffMember.id,
//       fullName: staffMember.fullName,
//       firstName: staffMember.firstName,
//       lastName: staffMember.lastName,
//       email: staffMember.email,
//       phoneNumber: staffMember.phoneNumber,
//       gender: staffMember.gender,
//       role: staffMember.role,
//       status: staffMember.status,
//       employeeId: staffMember.employeeId,
//       nationalId: staffMember.nationalId,
//       dateOfBirth: staffMember.dateOfBirth
//         ? new Date(staffMember.dateOfBirth)
//         : undefined,
//       dateOfJoining: staffMember.dateOfJoining
//         ? new Date(staffMember.dateOfJoining)
//         : undefined,
//       address: staffMember.address,
//       emergencyContact: staffMember.emergencyContact,
//       emergencyContactPhone: staffMember.emergencyContactPhone,
//       salary: staffMember.salary,
//       bankAccount: staffMember.bankAccount,
//       bankName: staffMember.bankName,
//       department: staffMember.department,
//       supervisor: staffMember.supervisor,
//       jobDescription: staffMember.jobDescription,
//       qualifications: staffMember.qualifications,
//       workExperience: staffMember.workExperience,
//       isActive: staffMember.isActive,
//       hasCompletedProfile: staffMember.hasCompletedProfile,
//       userId: staffMember.userId,
//       createdAt: staffMember.createdAt,
//       updatedAt: staffMember.updatedAt,
//     }));
//   }

//   async getStaffStatistics(tenantId: string) {
//     const totalStaff = await this.staffRepository.count({
//       where: { tenantId, isActive: true },
//     });

//     const activeStaff = await this.staffRepository.count({
//       where: { tenantId, isActive: true, status: StaffStatus.ACTIVE },
//     });

//     const inactiveStaff = await this.staffRepository.count({
//       where: { tenantId, isActive: true, status: StaffStatus.INACTIVE },
//     });

//     const suspendedStaff = await this.staffRepository.count({
//       where: { tenantId, isActive: true, status: StaffStatus.SUSPENDED },
//     });

//     const staffByRole = await this.staffRepository
//       .createQueryBuilder('staff')
//       .select('staff.role', 'role')
//       .addSelect('COUNT(*)', 'count')
//       .where('staff.tenantId = :tenantId', { tenantId })
//       .andWhere('staff.isActive = :isActive', { isActive: true })
//       .groupBy('staff.role')
//       .getRawMany();

//     const staffByDepartment = await this.staffRepository
//       .createQueryBuilder('staff')
//       .select('staff.department', 'department')
//       .addSelect('COUNT(*)', 'count')
//       .where('staff.tenantId = :tenantId', { tenantId })
//       .andWhere('staff.isActive = :isActive', { isActive: true })
//       .andWhere('staff.department IS NOT NULL')
//       .groupBy('staff.department')
//       .getRawMany();

//     return {
//       totalStaff,
//       activeStaff,
//       inactiveStaff,
//       suspendedStaff,
//       staffByRole,
//       staffByDepartment,
//     };
//   }
// }
