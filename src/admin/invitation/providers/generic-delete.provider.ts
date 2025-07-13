import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository, Not, Equal, FindOptionsWhere, ObjectLiteral } from 'typeorm';
import {

  MembershipRole,
  UserTenantMembership,
} from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { User } from 'src/admin/users/entities/user.entity';
import { validateMembershipAccess } from 'src/admin/shared/utils/access.utils';
import { InjectRepository } from '@nestjs/typeorm';
import { UserInvitation } from '../entities/user-iInvitation.entity';

@Injectable()
export class GenericDeleteProvider {
  constructor(
    @InjectRepository(UserTenantMembership)
    private readonly membershipRepository: Repository<UserTenantMembership>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(UserInvitation)
    private readonly invitationRepository: Repository<UserInvitation>,
  ) {}

  async deleteEntity<T extends ObjectLiteral>(
    repository: Repository<T>,
    entityId: string,
    currentUserId: string,
    tenantId: string,
    options: {
      roles?: MembershipRole[];
      entityRelations?: string[];
      userIdField?: string;
      deleteUserIfOrphaned?: boolean;
      cleanupInvitations?: boolean;
      invitationEmailField?: string;
    },
  ) {
    const {
      roles = [MembershipRole.SCHOOL_ADMIN],
      entityRelations = [],
      userIdField,
      deleteUserIfOrphaned = false,
      cleanupInvitations = false,
      invitationEmailField = 'email',
    } = options;

    await validateMembershipAccess(
      this.membershipRepository,
      currentUserId,
      tenantId,
      roles,
    );

    const entity = await repository.findOne({
      where: { id: entityId, tenant: { id: tenantId } } as any,
      relations: entityRelations,
    });

    if (!entity) {
      throw new NotFoundException(`${repository.metadata.name} not found`);
    }

    // Delete the main entity
    await repository.delete({ id: entityId } as unknown as FindOptionsWhere<T>);

    // Cleanup user memberships and user if needed
    if (userIdField && entity[userIdField]) {
      await this.membershipRepository.delete({
        user: { id: entity[userIdField] },
        tenant: { id: tenantId },
      });

      if (deleteUserIfOrphaned) {
        const otherMemberships = await this.membershipRepository.find({
          where: {
            user: { id: entity[userIdField] },
            tenant: Not(Equal(tenantId)),
          },
        });

        if (otherMemberships.length === 0) {
          await this.userRepository.delete({ id: entity[userIdField] });
        }
      }
    }

    // Cleanup related invitations
    if (cleanupInvitations && entity[invitationEmailField]) {
      await this.invitationRepository.delete({
        email: entity[invitationEmailField],
        tenant: { id: tenantId },
      });
    }

    return {
      message: `${repository.metadata.name} deleted successfully${
        userIdField && deleteUserIfOrphaned
          ? ' and user cleaned up if orphaned'
          : ''
      }${cleanupInvitations ? ' and invitations cleaned up' : ''}`,
    };
  }
}
