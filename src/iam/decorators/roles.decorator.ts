import { SetMetadata } from '@nestjs/common';
import { MembershipRole } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: MembershipRole[]) =>
  SetMetadata(ROLES_KEY, roles);
