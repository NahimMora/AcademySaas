export interface CourseOption {
  id: string;
  name: string;
  code: string;
  estimatedDurationWeeks?: number | null;
  defaultInstallments?: number;
  classDurationMinutes?: number | null;
  suggestedCapacity?: number | null;
  suggestedPriceCents?: number;
  currency?: string;
  suggestedCommissionBps?: number | null;
  active?: boolean;
}

export interface ScheduleDay {
  weekday: number;
  startsAt: string;
  endsAt: string;
}

export interface CohortOption {
  id: string;
  code: string;
  name: string;
  courseId: string;
  courseName: string;
  branchId?: string;
  branchName?: string;
  instructorUserId?: string | null;
  instructorName?: string | null;
  startDate?: string;
  estimatedEndDate?: string;
  status?: string;
  capacity: number;
  enrolledCount: number;
  installmentCents: number;
  installmentCount: number;
  scheduleDays?: ScheduleDay[];
  scheduleSummary?: string;
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
