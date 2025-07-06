import {
  BadRequestException,
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
import { LessThan, MoreThan, Repository } from 'typeorm';
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
  CreateStaffInvitationDto,
  StaffDto,
  UpdateStaffInput,
} from '../dtos/create-staff-invitation.dto';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { UsersService } from 'src/admin/users/providers/users.service';

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

    private readonly userService: UsersService,
  ) {}

  async inviteStaff(
    createStaffDto: CreateStaffInvitationDto,
    currentUser: ActiveUserData,
    tenantId: string,
  ) {
    // Verify that current user is SCHOOL_ADMIN for this tenant
    const membership = await this.membershipRepository.findOne({
      where: {
        user: { id: currentUser.sub },
        tenant: { id: tenantId },
        role: MembershipRole.SCHOOL_ADMIN,
        status: MembershipStatus.ACTIVE,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'Only SCHOOL_ADMIN can invite staff members',
      );
    }

    // Check if user with this email already exists in this tenant
    const existingUser = await this.userRepository.findOne({
      where: { email: createStaffDto.email },
    });

    if (existingUser) {
      const existingMembership = await this.membershipRepository.findOne({
        where: {
          user: { id: existingUser.id },
          tenant: { id: tenantId },
        },
      });

      if (existingMembership) {
        throw new BadRequestException('User already exists in this tenant');
      }
    }

  
    const tenMinutesAgo = new Date();
    tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);

    const recentInvitation = await this.invitationRepository.findOne({
      where: {
        email: createStaffDto.email,
        tenant: { id: tenantId },
        status: InvitationStatus.PENDING,
        createdAt: MoreThan(tenMinutesAgo),
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (recentInvitation) {
      throw new BadRequestException(
        'An invitation was already sent to this email recently. Please wait 10 minutes before sending another.',
      );
    }

    // Expire old pending invitations for this email and tenant
    await this.invitationRepository.update(
      {
        email: createStaffDto.email,
        tenant: { id: tenantId },
        status: InvitationStatus.PENDING,
        expiresAt: LessThan(new Date()),
      },
      {
        status: InvitationStatus.EXPIRED,
      },
    );

    // Get tenant info
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation record
    const invitation = this.invitationRepository.create({
      email: createStaffDto.email,
      role: createStaffDto.role,
      userData: createStaffDto,
      token,
      type: InvitationType.STAFF,
      status: InvitationStatus.PENDING,
      expiresAt,
      invitedBy: currentUser,
      tenant: { id: tenantId },
    });

    await this.invitationRepository.save(invitation);

    // Check if staff record already exists for this email
    let staff = await this.staffRepository.findOne({
      where: { email: createStaffDto.email },
    });

    if (!staff) {
      staff = this.staffRepository.create({
        ...createStaffDto,
        role: createStaffDto.role as any,
        isActive: false,
        hasCompletedProfile: false,
        tenant: { id: tenantId },
      });

      await this.staffRepository.save(staff);
    }

    // Send invitation email

    const user = await this.userService.findOneById(currentUser.sub);

    try {
      await this.emailService.sendStaffInvitation(
        createStaffDto.email,
        createStaffDto.fullName,
        tenant?.name || 'Unknown Tenant',
        token,
        user.name,
        tenantId,
        createStaffDto.role,
      );

    } catch (error) {
      console.error('[EmailService Error]', error);
      throw new EmailSendFailedException(createStaffDto.email);
    }

    return {
      email: invitation.email,
      fullName: staff.fullName,
      status: invitation.status,
      createdAt: invitation.createdAt,
    };
  }

  async acceptInvitation(token: string, password: string) {
    // Find invitation
    const invitation = await this.invitationRepository.findOne({
      where: {
        token,
        status: InvitationStatus.PENDING,
      },
      relations: ['tenant', 'invitedBy'],
    });

    if (!invitation) {
      throw new NotFoundException('Invalid or expired invitation');
    }

    if (invitation.expiresAt < new Date()) {
      await this.invitationRepository.update(invitation.id, {
        status: InvitationStatus.EXPIRED,
      });
      throw new BadRequestException('Invitation has expired');
    }

    let user = await this.userRepository.findOne({
      where: { email: invitation.email },
    });

    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const staffData = invitation.userData as CreateStaffInvitationDto;

      user = this.userRepository.create({
        email: invitation.email,
        password: hashedPassword,
        name: staffData.fullName,
        schoolUrl: invitation.tenant.subdomain,
      });

      await this.userRepository.save(user);
    }

    // Create tenant membership
    const membership = this.membershipRepository.create({
      user,
      tenant: invitation.tenant,
      role: MembershipRole.STAFF,
      status: MembershipStatus.ACTIVE,
    });

    await this.membershipRepository.save(membership);

    // Find and link the staff profile
    const staff = await this.staffRepository.findOne({
      where: { email: invitation.email },
    });

    if (staff) {
      staff.userId = user.id;
      staff.isActive = true;
      await this.staffRepository.save(staff);
    }

    // Update invitation status
    await this.invitationRepository.update(invitation.id, {
      status: InvitationStatus.ACCEPTED,
    });

    const tokens = await this.generateTokensProvider.generateTokens(
      user,
      membership,
      invitation.tenant,
    );
    const { accessToken, refreshToken } = tokens;

    return {
      message: 'Invitation accepted successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
      staff: staff
        ? {
            id: staff.id,
            name: staff.fullName,
            role: staff.role,
          }
        : null,
    };
  }

  async getStaffByTenant(tenantId: string): Promise<StaffDto[]> {
    const staff = await this.staffRepository.find({
      where: {
        tenantId,
        isActive: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return staff.map((staffMember) => ({
      id: staffMember.id,
      fullName: staffMember.fullName,
      firstName: staffMember.firstName,
      lastName: staffMember.lastName,
      email: staffMember.email,
      phoneNumber: staffMember.phoneNumber,
      gender: staffMember.gender,
      role: staffMember.role,
      status: staffMember.status,
      employeeId: staffMember.employeeId,
      nationalId: staffMember.nationalId,
      dateOfBirth: staffMember.dateOfBirth
        ? new Date(staffMember.dateOfBirth)
        : undefined,
      dateOfJoining: staffMember.dateOfJoining
        ? new Date(staffMember.dateOfJoining)
        : undefined,
      address: staffMember.address,
      emergencyContact: staffMember.emergencyContact,
      emergencyContactPhone: staffMember.emergencyContactPhone,
      salary: staffMember.salary,
      bankAccount: staffMember.bankAccount,
      bankName: staffMember.bankName,
      department: staffMember.department,
      supervisor: staffMember.supervisor,
      jobDescription: staffMember.jobDescription,
      qualifications: staffMember.qualifications,
      workExperience: staffMember.workExperience,
      isActive: staffMember.isActive,
      hasCompletedProfile: staffMember.hasCompletedProfile,
      userId: staffMember.userId,
      createdAt: staffMember.createdAt,
      updatedAt: staffMember.updatedAt,
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
      role: staff.role,
      status: staff.status,
      employeeId: staff.employeeId,
      nationalId: staff.nationalId,
      dateOfBirth: staff.dateOfBirth ? new Date(staff.dateOfBirth) : undefined,
      dateOfJoining: staff.dateOfJoining
        ? new Date(staff.dateOfJoining)
        : undefined,
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
    updateStaffInput: UpdateStaffInput,
    currentUser: User,
    tenantId: string,
  ) {
    // Verify admin access
    const membership = await this.membershipRepository.findOne({
      where: {
        user: { id: currentUser.id },
        tenant: { id: tenantId },
        role: MembershipRole.SCHOOL_ADMIN,
        status: MembershipStatus.ACTIVE,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'Only SCHOOL_ADMIN can update staff members',
      );
    }

    const staff = await this.staffRepository.findOne({
      where: { id: updateStaffInput.id, tenantId },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    Object.assign(staff, updateStaffInput);
    await this.staffRepository.save(staff);

    return this.getStaffById(staff.id, tenantId);
  }

  async deleteStaff(id: string, currentUser: User, tenantId: string) {
    // Verify admin access
    const membership = await this.membershipRepository.findOne({
      where: {
        user: { id: currentUser.id },
        tenant: { id: tenantId },
        role: MembershipRole.SCHOOL_ADMIN,
        status: MembershipStatus.ACTIVE,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'Only SCHOOL_ADMIN can delete staff members',
      );
    }

    const staff = await this.staffRepository.findOne({
      where: { id, tenantId },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    // Soft delete by setting isActive to false
    staff.isActive = false;
    await this.staffRepository.save(staff);

    return { message: 'Staff member deleted successfully' };
  }

  async getPendingInvitations(tenantId: string, currentUser: User) {
    // Verify admin access
    const membership = await this.membershipRepository.findOne({
      where: {
        user: { id: currentUser.id },
        tenant: { id: tenantId },
        role: MembershipRole.SCHOOL_ADMIN,
        status: MembershipStatus.ACTIVE,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Access denied');
    }

    return this.invitationRepository.find({
      where: {
        tenant: { id: tenantId },
        status: InvitationStatus.PENDING,
        type: InvitationType.STAFF,
      },
      relations: ['invitedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async revokeInvitation(invitationId: string, currentUser: User) {
    const invitation = await this.invitationRepository.findOne({
      where: { id: invitationId },
      relations: ['tenant'],
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Verify admin access
    const membership = await this.membershipRepository.findOne({
      where: {
        user: { id: currentUser.id },
        tenant: { id: invitation.tenant.id },
        role: MembershipRole.SCHOOL_ADMIN,
        status: MembershipStatus.ACTIVE,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Access denied');
    }

    await this.invitationRepository.update(invitationId, {
      status: InvitationStatus.REVOKED,
    });

    return { message: 'Invitation revoked successfully' };
  }

  async getStaffByRole(role: string, tenantId: string): Promise<StaffDto[]> {
    const staff = await this.staffRepository.find({
      where: {
        tenantId,
        role: role as any,
        isActive: true,
      },
      order: {
        fullName: 'ASC',
      },
    });

    return staff.map((staffMember) => ({
      id: staffMember.id,
      fullName: staffMember.fullName,
      firstName: staffMember.firstName,
      lastName: staffMember.lastName,
      email: staffMember.email,
      phoneNumber: staffMember.phoneNumber,
      gender: staffMember.gender,
      role: staffMember.role,
      status: staffMember.status,
      employeeId: staffMember.employeeId,
      nationalId: staffMember.nationalId,
      dateOfBirth: staffMember.dateOfBirth
        ? new Date(staffMember.dateOfBirth)
        : undefined,
      dateOfJoining: staffMember.dateOfJoining
        ? new Date(staffMember.dateOfJoining)
        : undefined,
      address: staffMember.address,
      emergencyContact: staffMember.emergencyContact,
      emergencyContactPhone: staffMember.emergencyContactPhone,
      salary: staffMember.salary,
      bankAccount: staffMember.bankAccount,
      bankName: staffMember.bankName,
      department: staffMember.department,
      supervisor: staffMember.supervisor,
      jobDescription: staffMember.jobDescription,
      qualifications: staffMember.qualifications,
      workExperience: staffMember.workExperience,
      isActive: staffMember.isActive,
      hasCompletedProfile: staffMember.hasCompletedProfile,
      userId: staffMember.userId,
      createdAt: staffMember.createdAt,
      updatedAt: staffMember.updatedAt,
    }));
  }

  async getActiveStaffByTenant(tenantId: string): Promise<StaffDto[]> {
    const staff = await this.staffRepository.find({
      where: {
        tenantId,
        isActive: true,
        status: StaffStatus.ACTIVE,
      },
      order: {
        fullName: 'ASC',
      },
    });

    return staff.map((staffMember) => ({
      id: staffMember.id,
      fullName: staffMember.fullName,
      firstName: staffMember.firstName,
      lastName: staffMember.lastName,
      email: staffMember.email,
      phoneNumber: staffMember.phoneNumber,
      gender: staffMember.gender,
      role: staffMember.role,
      status: staffMember.status,
      employeeId: staffMember.employeeId,
      nationalId: staffMember.nationalId,
      dateOfBirth: staffMember.dateOfBirth
        ? new Date(staffMember.dateOfBirth)
        : undefined,
      dateOfJoining: staffMember.dateOfJoining
        ? new Date(staffMember.dateOfJoining)
        : undefined,
      address: staffMember.address,
      emergencyContact: staffMember.emergencyContact,
      emergencyContactPhone: staffMember.emergencyContactPhone,
      salary: staffMember.salary,
      bankAccount: staffMember.bankAccount,
      bankName: staffMember.bankName,
      department: staffMember.department,
      supervisor: staffMember.supervisor,
      jobDescription: staffMember.jobDescription,
      qualifications: staffMember.qualifications,
      workExperience: staffMember.workExperience,
      isActive: staffMember.isActive,
      hasCompletedProfile: staffMember.hasCompletedProfile,
      userId: staffMember.userId,
      createdAt: staffMember.createdAt,
      updatedAt: staffMember.updatedAt,
    }));
  }

  async getStaffByDepartment(
    department: string,
    tenantId: string,
  ): Promise<StaffDto[]> {
    const staff = await this.staffRepository.find({
      where: {
        tenantId,
        department,
        isActive: true,
      },
      order: {
        fullName: 'ASC',
      },
    });

    return staff.map((staffMember) => ({
      id: staffMember.id,
      fullName: staffMember.fullName,
      firstName: staffMember.firstName,
      lastName: staffMember.lastName,
      email: staffMember.email,
      phoneNumber: staffMember.phoneNumber,
      gender: staffMember.gender,
      role: staffMember.role,
      status: staffMember.status,
      employeeId: staffMember.employeeId,
      nationalId: staffMember.nationalId,
      dateOfBirth: staffMember.dateOfBirth
        ? new Date(staffMember.dateOfBirth)
        : undefined,
      dateOfJoining: staffMember.dateOfJoining
        ? new Date(staffMember.dateOfJoining)
        : undefined,
      address: staffMember.address,
      emergencyContact: staffMember.emergencyContact,
      emergencyContactPhone: staffMember.emergencyContactPhone,
      salary: staffMember.salary,
      bankAccount: staffMember.bankAccount,
      bankName: staffMember.bankName,
      department: staffMember.department,
      supervisor: staffMember.supervisor,
      jobDescription: staffMember.jobDescription,
      qualifications: staffMember.qualifications,
      workExperience: staffMember.workExperience,
      isActive: staffMember.isActive,
      hasCompletedProfile: staffMember.hasCompletedProfile,
      userId: staffMember.userId,
      createdAt: staffMember.createdAt,
      updatedAt: staffMember.updatedAt,
    }));
  }

  async getStaffCount(tenantId: string): Promise<number> {
    return await this.staffRepository.count({
      where: {
        tenantId,
        isActive: true,
      },
    });
  }

  async searchStaff(searchTerm: string, tenantId: string): Promise<StaffDto[]> {
    const staff = await this.staffRepository
      .createQueryBuilder('staff')
      .where('staff.tenantId = :tenantId', { tenantId })
      .andWhere('staff.isActive = :isActive', { isActive: true })
      .andWhere(
        '(staff.fullName ILIKE :searchTerm OR staff.email ILIKE :searchTerm OR staff.employeeId ILIKE :searchTerm OR staff.department ILIKE :searchTerm)',
        { searchTerm: `%${searchTerm}%` },
      )
      .orderBy('staff.fullName', 'ASC')
      .getMany();

    return staff.map((staffMember) => ({
      id: staffMember.id,
      fullName: staffMember.fullName,
      firstName: staffMember.firstName,
      lastName: staffMember.lastName,
      email: staffMember.email,
      phoneNumber: staffMember.phoneNumber,
      gender: staffMember.gender,
      role: staffMember.role,
      status: staffMember.status,
      employeeId: staffMember.employeeId,
      nationalId: staffMember.nationalId,
      dateOfBirth: staffMember.dateOfBirth
        ? new Date(staffMember.dateOfBirth)
        : undefined,
      dateOfJoining: staffMember.dateOfJoining
        ? new Date(staffMember.dateOfJoining)
        : undefined,
      address: staffMember.address,
      emergencyContact: staffMember.emergencyContact,
      emergencyContactPhone: staffMember.emergencyContactPhone,
      salary: staffMember.salary,
      bankAccount: staffMember.bankAccount,
      bankName: staffMember.bankName,
      department: staffMember.department,
      supervisor: staffMember.supervisor,
      jobDescription: staffMember.jobDescription,
      qualifications: staffMember.qualifications,
      workExperience: staffMember.workExperience,
      isActive: staffMember.isActive,
      hasCompletedProfile: staffMember.hasCompletedProfile,
      userId: staffMember.userId,
      createdAt: staffMember.createdAt,
      updatedAt: staffMember.updatedAt,
    }));
  }

  async getStaffStatistics(tenantId: string) {
    const totalStaff = await this.staffRepository.count({
      where: { tenantId, isActive: true },
    });

    const activeStaff = await this.staffRepository.count({
      where: { tenantId, isActive: true, status: StaffStatus.ACTIVE },
    });

    const inactiveStaff = await this.staffRepository.count({
      where: { tenantId, isActive: true, status: StaffStatus.INACTIVE },
    });

    const suspendedStaff = await this.staffRepository.count({
      where: { tenantId, isActive: true, status: StaffStatus.SUSPENDED },
    });

    const staffByRole = await this.staffRepository
      .createQueryBuilder('staff')
      .select('staff.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .where('staff.tenantId = :tenantId', { tenantId })
      .andWhere('staff.isActive = :isActive', { isActive: true })
      .groupBy('staff.role')
      .getRawMany();

    const staffByDepartment = await this.staffRepository
      .createQueryBuilder('staff')
      .select('staff.department', 'department')
      .addSelect('COUNT(*)', 'count')
      .where('staff.tenantId = :tenantId', { tenantId })
      .andWhere('staff.isActive = :isActive', { isActive: true })
      .andWhere('staff.department IS NOT NULL')
      .groupBy('staff.department')
      .getRawMany();

    return {
      totalStaff,
      activeStaff,
      inactiveStaff,
      suspendedStaff,
      staffByRole,
      staffByDepartment,
    };
  }
}
