import { ForbiddenException } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import {
  MembershipStatus,
  MembershipRole,
  UserTenantMembership,
} from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';

export async function validateMembershipAccess(
  membershipRepo: Repository<UserTenantMembership>,
  userId: string,
  tenantId: string,
  roles: MembershipRole[] = [MembershipRole.SCHOOL_ADMIN],
) {
 const membership = await membershipRepo.findOne({
   where: {
     user: { id: userId },
     tenant: { id: tenantId },
     role: roles.length === 1 ? roles[0] : In(roles),
     status: MembershipStatus.ACTIVE,
   },
   relations: ['user', 'tenant'], 
 });

  if (!membership) {
    throw new ForbiddenException('Access denied');
  }

  console.log(membership, 'this is the membership');
  return membership;
}
