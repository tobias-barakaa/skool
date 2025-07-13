import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import { UserTenantMembership } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';

export async function checkIfUserAlreadyInTenant(
  email: string,
  tenantId: string,
  userRepository: Repository<User>,
  membershipRepository: Repository<UserTenantMembership>,
): Promise<void> {
  const user = await userRepository.findOne({
    where: { email },
  });

  if (!user) return;

  const existingMembership = await membershipRepository.findOne({
    where: {
      user: { id: user.id },
      tenant: { id: tenantId },
    },
  });

  if (existingMembership) {
    throw new BadRequestException('User already exists in this tenant');
  }
}
