import type { ScheduleDay } from "@/lib/billing/types";

export interface CohortRosterRow {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  status: string;
  balanceCents: number;
}

export interface CohortDetailDTO {
  id: string;
  academyId: string;
  code: string;
  name: string;
  status: string;
  courseId: string;
  courseName: string;
  branchId: string;
  branchName: string;
  instructorUserId: string | null;
  instructorName: string | null;
  startDate: string;
  estimatedEndDate: string;
  capacity: number;
  installmentCount: number;
  installmentCents: number;
  dueDay: number | null;
  commissionBps: number | null;
  debtPolicy: string;
  scheduleDays: ScheduleDay[];
  scheduleSummary: string;
  roster: CohortRosterRow[];
}
