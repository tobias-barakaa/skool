import { SetMetadata } from '@nestjs/common';
import { MembershipRole } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';

export const Roles = (...roles: MembershipRole[]) => SetMetadata('roles', roles);
