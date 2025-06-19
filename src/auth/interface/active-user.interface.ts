export interface ActiveUserData {
    // Id of the user
    sub: number;
    // email user
    email: string

    organizationId: string;

    schoolId?: string;
    schoolSubdomain?: string;
}