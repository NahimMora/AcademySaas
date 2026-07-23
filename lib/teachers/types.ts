export interface TeacherListItemDTO {
  userId: string;
  fullName: string;
  cohortCount: number;
  enrolledCount: number;
  capacity: number;
}

export interface TeacherCohortRow {
  id: string;
  code: string;
  name: string;
  courseName: string;
  status: string;
  enrolledCount: number;
  capacity: number;
  scheduleSummary: string;
}

export interface TeacherDetailDTO {
  userId: string;
  fullName: string;
  cohorts: TeacherCohortRow[];
}
