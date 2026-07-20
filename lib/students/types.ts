export interface AcademyOption {
  id: string;
  name: string;
}

export interface GuardianDTO {
  id: string;
  firstName: string;
  lastName: string;
  relationship: string;
  phone: string;
  email: string | null;
}

export interface StudentListItemDTO {
  id: string;
  publicCode: string;
  firstName: string;
  lastName: string;
  dniMasked: string;
  phone: string;
  email: string | null;
  status: "active" | "inactive" | "blocked" | "archived";
  createdAt: string;
  hasGuardian: boolean;
}

export interface StudentDetailDTO {
  id: string;
  academyId: string;
  publicCode: string;
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: string;
  phone: string;
  email: string | null;
  status: string;
  createdAt: string;
  guardian: GuardianDTO | null;
  enrollment: {
    id: string;
    status: string;
    installmentCount: number;
    cohortName: string;
    cohortCode: string;
    courseName: string;
  } | null;
}

export interface ChargeRowDTO {
  id: string;
  description: string;
  finalCents: number;
  paidCents: number;
  dueDate: string;
  status: string;
  pendingPayment: { id: string; method: string } | null;
  confirmedPaymentId: string | null;
}

export interface PaymentRowDTO {
  id: string;
  reference: string | null;
  amountCents: number;
  method: string;
  status: string;
  registeredAt: string;
}
