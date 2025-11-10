import { MembershipRole } from "src/admin/user-tenant-membership/entities/user-tenant-membership.entity";
import { User } from "src/admin/users/entities/user.entity";

export interface ActiveUserData {
    sub: string;
    email: string;
    
    membershipId?: string;
    globalRole?: User['globalRole'];
    subdomain?: string;
    tenantId?: string;
    role?: MembershipRole;
  }
  

//   export interface ActiveTenantUser extends ActiveUserData {
//     tenantId: string; 
//     subdomain: string; 
//     membershipId: string; 
//     role: MembershipRole;
// }


 