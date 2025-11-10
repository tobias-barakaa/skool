import { SetMetadata } from '@nestjs/common';
import { MembershipRole } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { ROLES_KEY } from '../constants/auth.constants';

/**
 * Defines required tenant roles for a route
 * Super Admins bypass role checks
 * @Roles(MembershipRole.TEACHER, MembershipRole.STUDENT)
 */
export const Roles = (...roles: MembershipRole[]) =>
  SetMetadata(ROLES_KEY, roles);
