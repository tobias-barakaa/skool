export interface StudentWithDetails {
  id: string;
  name: string;
  email: string;
  admissionNumber: string;
  grade: string;
  stream?: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}
