export interface ActiveUserData {
    sub: string;
    email: string;
    tenantId: string;
    subdomain: string;
    membershipId: string;
    isGlobalAdmin?: boolean
    globalRole? : boolean
  }
  