// src/users/services/users.service.ts
import { BadRequestException, Injectable, Logger, RequestTimeoutException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UsersCreateProvider } from '../providers/users-create.provider';
import { School } from '../../school/entities/school.entity';
import { CreateUserInput } from '../dtos/create-user.input';
import { SignupInput } from '../dtos/signUp-input';
import { MembershipRole, UserTenantMembership } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly usersCreateProvider: UsersCreateProvider,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,


        @InjectRepository(UserTenantMembership)
        private membershipRepository: Repository<UserTenantMembership>
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

    /**
     * handle user does not exits
     */

    if (!user) {
      throw new BadRequestException('User does not exist');
    }

    return user;
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({ relations: ['school'] });
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
}
