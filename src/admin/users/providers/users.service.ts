// src/users/services/users.service.ts
import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException, RequestTimeoutException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UsersCreateProvider } from '../providers/users-create.provider';
import { School } from '../../school/entities/school.entity';
import { CreateUserInput } from '../dtos/create-user.input';
import { SignupInput } from '../dtos/signUp-input';
import { MembershipRole, UserTenantMembership } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  

  constructor(
    private readonly usersCreateProvider: UsersCreateProvider,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(UserTenantMembership)
    private membershipRepository: Repository<UserTenantMembership>,
    private readonly dataSource: DataSource
  ) {}

  async createUser(signupInput: SignupInput) {
    return this.usersCreateProvider.createUser(signupInput);
  }

  public async findOneById(id: string) {
    let user: User | null = null;
    try {
      user = await this.userRepository.findOne({
        where: {
          id: id.toString(),
        },
      });
    } catch (error) {
      throw new RequestTimeoutException('Error while finding user', {
        description: 'Error Connecting to the database',
      });
    }

    if (!user) {
      throw new BadRequestException('User does not exist');
    }

    return user;
  }



  async adminChangeUserPassword(userId: string, newPassword: string) {
    return this.usersCreateProvider.adminChangeUserPassword(userId, newPassword)
  }



  async changePassword(currentUser: ActiveUserData, oldPassword: string, newPassword: string) {
    return this.usersCreateProvider.changePassword(currentUser, oldPassword, newPassword)
  }



  async changeEmail(currentUser: ActiveUserData, newEmail: string): Promise<boolean> {
    return this.usersCreateProvider.changeEmail(currentUser, newEmail)
  }
  


  async adminChangeUserEmail(userId: string, newEmail: string): Promise<boolean> {
    return this.usersCreateProvider.adminChangeUserEmail(userId, newEmail)
  }

  async setTeacherStatus(currentUser: ActiveUserData, teacherId: string, isActive: boolean) {
    return this.usersCreateProvider.setTeacherStatus(currentUser, teacherId, isActive)
  }
  

  // ----------------- Admin/Super Admin change another user's email -----------------
 

  async findAll(): Promise<User[]> {
    return this.userRepository.find({ relations: ['school'] });
  };


  async deleteUser(userIdToDelete: string, user: ActiveUserData): Promise<boolean> {
   
    const tenantId = user.tenantId;
    const loggedInUser = user.sub;
    if(!tenantId) {
      throw new NotFoundException('Tenant not found')
    }

     if (loggedInUser) {
    throw new ForbiddenException('You cannot delete yourself');
  }
    const targetUser = await this.userRepository.findOne({ where: { id: userIdToDelete } });
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // 2. Check if user belongs to the same tenant
    const membership = await this.membershipRepository.findOne({
      where: { userId: userIdToDelete, tenantId },
    });

    if (!membership || membership.tenantId !== tenantId) {
      throw new ForbiddenException('Cannot delete user outside your tenant');
    }

    // 3. Delete user
    await this.userRepository.delete(userIdToDelete);

    return true;
  }

  async findUsersByTenant(
    tenantId: string,
    role?: MembershipRole,
  ): Promise<(User & { tenantId: string; role: MembershipRole })[]> {
    const query = this.membershipRepository
      .createQueryBuilder('membership')
      .innerJoinAndSelect('membership.user', 'user')
      .where('membership.tenantId = :tenantId', { tenantId });

    if (role) {
      query.andWhere('membership.role = :role', { role });
    }

    const results = await query.getMany();

    return results.map((membership) => ({
      ...membership.user,
      tenantId: membership.tenantId,
      role: membership.role,
    }));
  }

  async findAllUsersOfTenant(
    tenantId: string,
  ): Promise<(User & { tenantId: string; role: MembershipRole })[]> {
    const results = await this.membershipRepository.find({
      where: { tenantId },
      relations: ['user'],
    });

    return results.map((membership) => ({
      ...membership.user,
      tenantId: membership.tenantId,
      role: membership.role,
    }));
  }
}
