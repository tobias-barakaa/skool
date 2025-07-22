import { MembershipRole } from "src/admin/user-tenant-membership/entities/user-tenant-membership.entity";

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: MembershipRole;
  isActive: boolean;
  user: {
    id: string;
    name: string;
    email: string;
  };
}
