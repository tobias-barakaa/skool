// DTOs for parent invitation

import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Parent } from "../entities/parent.entity";
import { InjectRepository } from "@nestjs/typeorm";
import * as crypto from 'crypto';
import { LessThan, MoreThan, Repository } from "typeorm";
import { ParentStudent } from "../entities/parent-student.entity";
import { Student } from "src/admin/student/entities/student.entity";
import { User } from "src/admin/users/entities/user.entity";
import { InvitationStatus, InvitationType, UserInvitation } from "src/admin/invitation/entities/user-iInvitation.entity";
import { MembershipRole, MembershipStatus, UserTenantMembership } from "src/admin/user-tenant-membership/entities/user-tenant-membership.entity";
import { Tenant } from "src/admin/tenants/entities/tenant.entity";
import { CreateParentInvitationDto, StudentLinkInput } from "../dtos/create-parent.dto";
import { EmailSendFailedException } from "src/admin/common/exceptions/business.exception";
import { StudentSearchInput } from "../dtos/search-student.dto";
import { EmailService } from "src/admin/email/providers/email.service";

@Injectable()
export class ParentService {
  constructor(
    @InjectRepository(Parent)
    private parentRepository: Repository<Parent>,
    @InjectRepository(ParentStudent)
    private parentStudentRepository: Repository<ParentStudent>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserInvitation)
    private invitationRepository: Repository<UserInvitation>,
    @InjectRepository(UserTenantMembership)
    private membershipRepository: Repository<UserTenantMembership>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    private emailService: EmailService,
  ) {}

  // NEW METHOD: Invite parent with email invitation
  async inviteParent(
    createParentDto: CreateParentInvitationDto,
    currentUser: User,
    tenantId: string,
  ) {
    // Verify that current user is SCHOOL_ADMIN for this tenant
    const membership = await this.membershipRepository.findOne({
      where: {
        user: { id: currentUser.id },
        tenant: { id: tenantId },
        role: MembershipRole.SCHOOL_ADMIN,
        status: MembershipStatus.ACTIVE,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Only SCHOOL_ADMIN can invite parents');
    }

    // Validate that all students exist BEFORE creating invitation
    const validationResult = await this.validateStudentsForInvitation(
      createParentDto.students,
      tenantId,
    );

    if (!validationResult.isValid) {
      throw new BadRequestException(
        `Cannot invite parent. ${validationResult.errorMessage}`,
      );
    }

    // Check if user with this email already exists in this tenant
    const existingUser = await this.userRepository.findOne({
      where: { email: createParentDto.email },
    });

    if (existingUser) {
      const existingParent = await this.parentRepository.findOne({
        where: {
          email: createParentDto.email,
          tenantId
        },
      });

      if (existingParent) {
        throw new BadRequestException('Parent already exists in this tenant');
      }
    }

    // Check for recent pending invitation (within last 10 minutes)
    const tenMinutesAgo = new Date();
    tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);

    const recentInvitation = await this.invitationRepository.findOne({
      where: {
        email: createParentDto.email,
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
        email: createParentDto.email,
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

    // Create invitation record with student linking data
    const invitation = this.invitationRepository.create({
      email: createParentDto.email,
      role: MembershipRole.PARENT,
      userData: {
        ...createParentDto,
        validatedStudents: validationResult.validatedStudents,
      },
      token,
      type: InvitationType.PARENT,
      status: InvitationStatus.PENDING,
      expiresAt,
      invitedBy: currentUser,
      tenant: { id: tenantId },
    });

    await this.invitationRepository.save(invitation);

    // Send invitation email
    try {
      await this.emailService.sendParentInvitation(
        createParentDto.email,
        `${createParentDto.firstName} ${createParentDto.lastName}`,
        tenant?.name || 'Unknown Tenant',
        token,
        currentUser.name,
        tenantId,
        validationResult.validatedStudents.map(s => s.user ?
          `${s.user.firstName} ${s.user.lastName}` : 'Unknown Student'
        ),
      );
    } catch (error) {
      console.error('[EmailService Error]', error);
      throw new EmailSendFailedException(createParentDto.email);
    }

    return {
      email: invitation.email,
      fullName: `${createParentDto.firstName} ${createParentDto.lastName}`,
      status: invitation.status,
      createdAt: invitation.createdAt,
      linkedStudents: validationResult.validatedStudents.length,
    };
  }

  // NEW METHOD: Validate students for invitation with suggestions
  async validateStudentsForInvitation(
    studentLinks: StudentLinkInput[],
    tenantId: string,
  ): Promise<{
    isValid: boolean;
    validatedStudents: Student[];
    errorMessage?: string;
  }> {
    const validatedStudents: Student[] = [];
    const notFoundStudents: string[] = [];
    const suggestions: string[] = [];

    for (const link of studentLinks) {
      const student = await this.findStudentByMultipleCriteria(link, tenantId);

      if (student) {
        validatedStudents.push(student);
      } else {
        // Create descriptive error message based on search criteria
        let searchCriteria = '';
        if (link.studentId) searchCriteria = `ID: ${link.studentId}`;
        else if (link.admissionNumber)
          searchCriteria = `Admission Number: ${link.admissionNumber}`;
        else if (link.studentName) searchCriteria = `Name: ${link.studentName}`;
        else if (link.studentPhone)
          searchCriteria = `Phone: ${link.studentPhone}`;
        else searchCriteria = 'Unknown criteria';

        notFoundStudents.push(searchCriteria);

        // Try to find similar students for suggestions
        const similarStudents = await this.findSimilarStudents(link, tenantId);
        if (similarStudents.length > 0) {
          suggestions.push(
            `For ${searchCriteria}, did you mean: ${similarStudents
              .map(s => `${s.user?.firstName} ${s.user?.lastName} (${s.admissionNumber})`)
              .join(', ')}`
          );
        }
      }
    }

    if (notFoundStudents.length > 0) {
      let errorMessage = `The following students were not found: ${notFoundStudents.join(', ')}.`;
      if (suggestions.length > 0) {
        errorMessage += ` Suggestions: ${suggestions.join('; ')}`;
      }
      errorMessage += ' Please verify the student information and try again.';

      return {
        isValid: false,
        validatedStudents: [],
        errorMessage,
      };
    }

    if (validatedStudents.length === 0) {
      return {
        isValid: false,
        validatedStudents: [],
        errorMessage: 'No valid students found. Cannot invite parent without linking to at least one student.',
      };
    }

    return {
      isValid: true,
      validatedStudents,
    };
  }

  // NEW METHOD: Find similar students for suggestions
  async findSimilarStudents(
    criteria: StudentLinkInput,
    tenantId: string,
    limit: number = 3,
  ): Promise<Student[]> {
    const queryBuilder = this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.user', 'user')
      .where('student.tenantId = :tenantId', { tenantId })
      .andWhere('student.isActive = :isActive', { isActive: true });

    // Look for similar admission numbers
    if (criteria.admissionNumber) {
      queryBuilder.andWhere('student.admission_number ILIKE :admissionNumber', {
        admissionNumber: `%${criteria.admissionNumber}%`,
      });
    }
    // Look for similar names
    else if (criteria.studentName) {
      queryBuilder.andWhere(
        "(LOWER(user.firstName) ILIKE LOWER(:name) OR LOWER(user.lastName) ILIKE LOWER(:name))",
        { name: `%${criteria.studentName}%` },
      );
    }
    // Look for similar phone numbers
    else if (criteria.studentPhone) {
      queryBuilder.andWhere('student.phone ILIKE :phone', {
        phone: `%${criteria.studentPhone}%`,
      });
    }

    return await queryBuilder.limit(limit).getMany();
  }

  // NEW METHOD: Handle invitation acceptance
  async acceptParentInvitation(token: string): Promise<Parent> {
    const invitation = await this.invitationRepository.findOne({
      where: {
        token,
        status: InvitationStatus.PENDING,
        type: InvitationType.PARENT,
        expiresAt: MoreThan(new Date()),
      },
      relations: ['tenant', 'invitedBy'],
    });

    if (!invitation) {
      throw new BadRequestException('Invalid or expired invitation');
    }

    // Extract the invitation data
    const parentData = invitation.userData;
    const validatedStudents = parentData.validatedStudents;

    // Create or find user
    let user = await this.userRepository.findOne({
      where: { email: invitation.email },
    });

    if (!user) {
      user = this.userRepository.create({
        email: invitation.email,
        firstName: parentData.firstName,
        lastName: parentData.lastName,
        phone: parentData.phone,
      });
      user = await this.userRepository.save(user);
    }

    // Create parent
    const parent = this.parentRepository.create({
      email: invitation.email,
      firstName: parentData.firstName,
      lastName: parentData.lastName,
      phone: parentData.phone,
      userId: user.id,
      tenantId: invitation.tenant.id,
      isActive: true,
    });

    const savedParent = await this.parentRepository.save(parent);

    // Create membership for parent
    const membership = this.membershipRepository.create({
      user: user,
      tenant: invitation.tenant,
      role: MembershipRole.PARENT,
      status: MembershipStatus.ACTIVE,
      joinedAt: new Date(),
    });

    await this.membershipRepository.save(membership);

    // Link students to parent
    await this.linkValidatedStudentsToParent(
      savedParent.id,
      validatedStudents,
      parentData.students,
      invitation.tenant.id,
    );

    // Mark invitation as accepted
    invitation.status = InvitationStatus.ACCEPTED;
    invitation.acceptedAt = new Date();
    await this.invitationRepository.save(invitation);

    return this.findParentById(savedParent.id, invitation.tenant.id);
  }

  // NEW METHOD: Enhanced student search with fuzzy matching
  async searchStudentsAdvanced(
    searchInput: StudentSearchInput,
    tenantId: string,
  ): Promise<{
    exactMatches: Student[];
    similarMatches: Student[];
  }> {
    const exactMatches = await this.searchStudents(searchInput, tenantId);

    // If we have exact matches, return them
    if (exactMatches.length > 0) {
      return {
        exactMatches,
        similarMatches: [],
      };
    }

    // Otherwise, look for similar matches
    const similarMatches = await this.findSimilarStudents(
      {
        studentName: searchInput.name,
        admissionNumber: searchInput.admissionNumber,
        studentPhone: searchInput.phone,
        studentGrade: searchInput.grade,
      },
      tenantId,
      10,
    );

    return {
      exactMatches: [],
      similarMatches,
    };
  }

  // EXISTING METHOD: Create parent directly (without invitation)
  async createParent(
    createParentInput: CreateParentInput,
    tenantId: string,
  ): Promise<Parent> {
    // STEP 1: Validate that all students exist BEFORE creating parent
    const validatedStudents = await this.validateAndFindStudents(
      createParentInput.students,
      tenantId,
    );

    if (validatedStudents.length === 0) {
      throw new BadRequestException(
        'No valid students found. Cannot create parent without linking to at least one student.',
      );
    }

    // STEP 2: Check if parent with email already exists for this tenant
    const existingParent = await this.parentRepository.findOne({
      where: { email: createParentInput.email, tenantId },
    });

    if (existingParent) {
      // If parent exists, link to new students instead
      await this.linkValidatedStudentsToParent(
        existingParent.id,
        validatedStudents,
        createParentInput.students,
        tenantId,
      );
      return this.findParentById(existingParent.id, tenantId);
    }

    // STEP 3: Create or find user
    let user = await this.userRepository.findOne({
      where: { email: createParentInput.email },
    });

    if (!user) {
      user = this.userRepository.create({
        email: createParentInput.email,
        firstName: createParentInput.firstName,
        lastName: createParentInput.lastName,
        phone: createParentInput.phone,
      });
      user = await this.userRepository.save(user);
    }

    // STEP 4: Create parent (only after students are validated)
    const parent = this.parentRepository.create({
      ...createParentInput,
      userId: user.id,
      tenantId,
    });

    const savedParent = await this.parentRepository.save(parent);

    // STEP 5: Link validated students to parent
    await this.linkValidatedStudentsToParent(
      savedParent.id,
      validatedStudents,
      createParentInput.students,
      tenantId,
    );

    return this.findParentById(savedParent.id, tenantId);
  }

  // EXISTING METHOD: Validate students and find them
  async validateAndFindStudents(
    studentLinks: StudentLinkInput[],
    tenantId: string,
  ): Promise<Student[]> {
    const validatedStudents: Student[] = [];
    const notFoundStudents: string[] = [];

    for (const link of studentLinks) {
      const student = await this.findStudentByMultipleCriteria(link, tenantId);

      if (student) {
        validatedStudents.push(student);
      } else {
        // Create descriptive error message based on search criteria
        let searchCriteria = '';
        if (link.studentId) searchCriteria = `ID: ${link.studentId}`;
        else if (link.admissionNumber)
          searchCriteria = `Admission Number: ${link.admissionNumber}`;
        else if (link.studentName) searchCriteria = `Name: ${link.studentName}`;
        else if (link.studentPhone)
          searchCriteria = `Phone: ${link.studentPhone}`;
        else searchCriteria = 'Unknown criteria';

        notFoundStudents.push(searchCriteria);
      }
    }

    if (notFoundStudents.length > 0) {
      throw new BadRequestException(
        `Cannot create parent. The following students were not found: ${notFoundStudents.join(', ')}. Please verify the student information and try again.`,
      );
    }

    return validatedStudents;
  }

  // EXISTING METHOD: Link validated students to parent
  async linkValidatedStudentsToParent(
    parentId: string,
    validatedStudents: Student[],
    studentLinks: StudentLinkInput[],
    tenantId: string,
  ): Promise<void> {
    for (let i = 0; i < validatedStudents.length; i++) {
      const student = validatedStudents[i];
      const link = studentLinks[i];

      // Check if relationship already exists
      const existingLink = await this.parentStudentRepository.findOne({
        where: { parentId, studentId: student.id, tenantId },
      });

      if (existingLink) {
        // Update existing relationship if needed
        existingLink.relationship = link.relationship;
        existingLink.isPrimary = link.isPrimary || false;
        await this.parentStudentRepository.save(existingLink);
      } else {
        // Create new relationship
        const parentStudent = this.parentStudentRepository.create({
          parentId,
          studentId: student.id,
          relationship: link.relationship,
          isPrimary: link.isPrimary || false,
          tenantId,
        });

        await this.parentStudentRepository.save(parentStudent);
      }
    }
  }

  // EXISTING METHOD: Find student by multiple criteria
  async findStudentByMultipleCriteria(
    criteria: StudentLinkInput,
    tenantId: string,
  ): Promise<Student | null> {
    const queryBuilder = this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.user', 'user')
      .where('student.tenantId = :tenantId', { tenantId });

    // If studentId is provided, prioritize it
    if (criteria.studentId) {
      queryBuilder.andWhere('student.id = :studentId', {
        studentId: criteria.studentId,
      });
    }
    // If admission number is provided
    else if (criteria.admissionNumber) {
      queryBuilder.andWhere('student.admission_number = :admissionNumber', {
        admissionNumber: criteria.admissionNumber,
      });
    }
    // If student name is provided
    else if (criteria.studentName) {
      queryBuilder.andWhere(
        "(LOWER(user.firstName) LIKE LOWER(:name) OR LOWER(user.lastName) LIKE LOWER(:name) OR LOWER(CONCAT(user.firstName, ' ', user.lastName)) LIKE LOWER(:name))",
        { name: `%${criteria.studentName}%` },
      );
    }
    // If phone is provided
    else if (criteria.studentPhone) {
      queryBuilder.andWhere('student.phone = :phone', {
        phone: criteria.studentPhone,
      });
    }

    // Add grade filter if provided
    if (criteria.studentGrade) {
      queryBuilder.andWhere('student.grade = :grade', {
        grade: criteria.studentGrade,
      });
    }

    return await queryBuilder.getOne();
  }

  // EXISTING METHOD: Search students
  async searchStudents(
    searchInput: StudentSearchInput,
    tenantId: string,
  ): Promise<Student[]> {
    const queryBuilder = this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.user', 'user')
      .where('student.tenantId = :tenantId', { tenantId })
      .andWhere('student.isActive = :isActive', { isActive: true });

    if (searchInput.name) {
      queryBuilder.andWhere(
        "(LOWER(user.firstName) LIKE LOWER(:name) OR LOWER(user.lastName) LIKE LOWER(:name) OR LOWER(CONCAT(user.firstName, ' ', user.lastName)) LIKE LOWER(:name))",
        { name: `%${searchInput.name}%` },
      );
    }

    if (searchInput.admissionNumber) {
      queryBuilder.andWhere('student.admission_number LIKE :admissionNumber', {
        admissionNumber: `%${searchInput.admissionNumber}%`,
      });
    }

    if (searchInput.phone) {
      queryBuilder.andWhere('student.phone LIKE :phone', {
        phone: `%${searchInput.phone}%`,
      });
    }

    if (searchInput.grade) {
      queryBuilder.andWhere('student.grade = :grade', {
        grade: searchInput.grade,
      });
    }

    return await queryBuilder.limit(20).getMany();
  }

  // EXISTING METHOD: Find parent by ID
  async findParentById(id: string, tenantId: string): Promise<Parent> {
    const parent = await this.parentRepository.findOne({
      where: { id, tenantId },
      relations: [
        'user',
        'parentStudents',
        'parentStudents.student',
        'parentStudents.student.user',
      ],
    });

    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    return parent;
  }

  // EXISTING METHOD: Find all parents
  async findAllParents(tenantId: string): Promise<Parent[]> {
    return await this.parentRepository.find({
      where: { tenantId, isActive: true },
      relations: [
        'user',
        'parentStudents',
        'parentStudents.student',
        'parentStudents.student.user',
      ],
      order: { createdAt: 'DESC' },
    });
  }
}




  // async updateParent(
  //   id: string,
  //   updateData: Partial<CreateParentInput>,
  //   tenantId: string,
  // ): Promise<Parent> {
  //   const parent = await this.findParentById(id, tenantId);

  //   // Update basic parent info
  //   Object.assign(parent, updateData);
  //   await this.parentRepository.save(parent);

  //   // Update user info if needed
  //   if (
  //     updateData.firstName ||
  //     updateData.lastName ||
  //     updateData.email ||
  //     updateData.phone
  //   ) {
  //     const user = await this.userRepository.findOne({
  //       where: { id: parent.userId },
  //     });
  //     if (user) {
  //       if (updateData.firstName) user.firstName = updateData.firstName;
  //       if (updateData.lastName) user.lastName = updateData.lastName;
  //       if (updateData.email) user.email = updateData.email;
  //       if (updateData.phone) user.phone = updateData.phone;
  //       await this.userRepository.save(user);
  //     }
  //   }

  //   return this.findParentById(id, tenantId);
  // }

  // async deleteParent(id: string, tenantId: string): Promise<boolean> {
  //   const parent = await this.findParentById(id, tenantId);

  //   // Soft delete by setting isActive to false
  //   parent.isActive = false;
  //   await this.parentRepository.save(parent);

  //   // Also deactivate parent-student relationships
  //   await this.parentStudentRepository.update(
  //     { parentId: id, tenantId },
  //     { isActive: false },
  //   );

  //   return true;
  // }
