export interface ActiveUserData {
    sub: string; // UUID string now, not number
    email: string;
    tenantId: string;
    subdomain: string;
    membershipId: string;
  }
  