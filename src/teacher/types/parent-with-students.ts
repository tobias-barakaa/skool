export interface ParentWithStudentss {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
  students: {
    id: string;
    name: string;
    admissionNumber: string;
    grade: string;
  }[];
}
