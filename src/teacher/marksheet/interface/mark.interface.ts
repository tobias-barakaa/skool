
interface Assessment {
  id: string;
  title: string;
  type: 'CA' | 'EXAM';
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
  term: number;
  maxScore: number;
  cutoff: number;
  tenantGradeLevelId: string;
  tenantSubjectId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Student {
  id: string;
  name: string;
  studentNumber?: string;
}
export interface Mark {
  id: string;
  studentId: string;
  assessmentId: string;
  score: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarksheetEntry {
  student: Student;
  marks: { [assessmentId: string]: number | null };
  finalScore: number;
}

export interface MarksheetData {
  assessments: Assessment[];
  entries: MarksheetEntry[];
  statistics: {
    meanScore: number;
    highestScore: number;
    lowestScore: number;
    totalStudents: number;
    studentsWithMarks: number;
  };
}

export interface CreateMarkInput {
  studentId: string;
  assessmentId: string;
  score: number;
}

export interface UpdateMarkInput {
  id: string;
  score: number;
}
