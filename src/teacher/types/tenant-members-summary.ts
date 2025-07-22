import { StaffMember } from "./staff-member";
import { ParentWithStudentss } from "./parent-with-students";
import { StudentWithDetails } from "./student-with-details";

export interface TenantMembersSummary {
  students: StudentWithDetails[];
  parents: ParentWithStudentss[];
  staff: StaffMember[];
  totalCount: {
    students: number;
    parents: number;
    staff: number;
  };
}
