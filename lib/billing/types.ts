export interface CourseOption {
  id: string;
  name: string;
  code: string;
}

export interface CohortOption {
  id: string;
  code: string;
  name: string;
  courseId: string;
  courseName: string;
  capacity: number;
  enrolledCount: number;
  installmentCents: number;
  installmentCount: number;
}

export interface EnrollmentRowDTO {
  id: string;
  studentId: string;
  studentName: string;
  cohortName: string;
  agreedPriceCents: number;
  installmentCount: number;
  status: string;
  chargesTotal: number;
  chargesPaid: number;
  balanceCents: number;
}
