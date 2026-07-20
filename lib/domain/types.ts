export type Role = "platform_superadmin" | "owner" | "receptionist" | "instructor";
export type Severity = "info" | "low" | "medium" | "high" | "critical";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  workspaceId?: string;
  academyId?: string;
  branchId?: string;
}

export interface Student {
  id: string;
  publicCode: string;
  workspaceId: string;
  academyId: string;
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: string;
  phone: string;
  email?: string;
  status: "active" | "inactive" | "blocked" | "archived";
  guardian?: { name: string; relationship: string; phone: string };
  qrCode: string;
  createdAt: string;
}

export interface Cohort {
  id: string;
  workspaceId: string;
  academyId: string;
  branchId: string;
  code: string;
  name: string;
  course: string;
  instructor: string;
  schedule: string;
  capacity: number;
  enrolled: number;
  installmentCents: number;
  installments: number;
  durationMonths: number;
  commissionBps: number;
  debtPolicy: "inform_only" | "allow_with_warning" | "block_if_overdue" | "block_if_no_confirmed_payment" | "manual_review";
  status: "draft" | "scheduled" | "active" | "paused" | "finished";
}

export interface Enrollment {
  id: string;
  workspaceId: string;
  studentId: string;
  cohortId: string;
  status: "pending_payment" | "confirmed" | "attending" | "overdue" | "dropped_out" | "completed" | "cancelled";
  agreedPriceCents: number;
  installments: number;
  enrolledAt: string;
}

export interface Charge {
  id: string;
  workspaceId: string;
  studentId: string;
  enrollmentId: string;
  concept: string;
  amountCents: number;
  paidCents: number;
  dueDate: string;
  status: "pending" | "partial" | "paid" | "overdue" | "cancelled";
  commissionable: boolean;
}

export interface Payment {
  id: string;
  workspaceId: string;
  studentId: string;
  amountCents: number;
  method: "cash" | "bank_transfer" | "mercado_pago" | "debit_card" | "credit_card" | "other";
  status: "pending_validation" | "confirmed" | "rejected" | "reversed";
  reference: string;
  registeredAt: string;
  allocationChargeId?: string;
}

export interface ClassSession {
  id: string;
  workspaceId: string;
  cohortId: string;
  date: string;
  startsAt: string;
  endsAt: string;
  status: "scheduled" | "open" | "completed" | "cancelled";
  attendanceClosed: boolean;
}

export interface AttendanceRecord {
  id: string;
  workspaceId: string;
  classId: string;
  studentId: string;
  status: "present" | "late" | "absent";
  markedAt: string;
}

export interface Course {
  id: string;
  workspaceId: string;
  name: string;
  code: string;
  duration: string;
  durationMonths: number;
  priceCents: number;
}

export interface Checkin {
  id: string;
  workspaceId: string;
  studentId?: string;
  classId?: string;
  result: "authorized" | "warning" | "denied";
  reason: string;
  createdAt: string;
}

export interface RequestItem {
  id: string;
  workspaceId: string;
  type: string;
  requester: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface AlertItem {
  id: string;
  workspaceId: string;
  severity: Severity;
  title: string;
  detail: string;
  status: "new" | "under_review" | "resolved" | "dismissed";
  createdAt: string;
}

export interface AuditItem {
  id: string;
  workspaceId?: string;
  actor: string;
  action: string;
  entity: string;
  detail: string;
  createdAt: string;
}

export interface SettlementClosure {
  id: string;
  workspaceId: string;
  instructor: string;
  periodLabel: string;
  baseCents: number;
  commissionCents: number;
  closedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  plan: string;
  status: "trial" | "active" | "past_due" | "suspended" | "cancelled" | "archived";
  academies: number;
  users: number;
  students: number;
  nextReview: string;
  billingNote: string;
}

export interface PlatformUser {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  role: string;
  scope: string;
  status: "active" | "invited";
  lastAccess: string;
}

export interface DemoState {
  students: Student[];
  cohorts: Cohort[];
  courses: Course[];
  enrollments: Enrollment[];
  charges: Charge[];
  payments: Payment[];
  classes: ClassSession[];
  attendance: AttendanceRecord[];
  checkins: Checkin[];
  requests: RequestItem[];
  alerts: AlertItem[];
  settlements: SettlementClosure[];
  audit: AuditItem[];
  workspaces: Workspace[];
  users: PlatformUser[];
  notificationsRead: boolean;
}
