export interface BranchOption {
  id: string;
  name: string;
  academyId: string;
  academyName: string;
}

export interface CashSessionDTO {
  id: string;
  branchId: string;
  academyId: string;
  openedBy: string;
  openedAt: string;
  openingCents: number;
  status: "open" | "closed";
  closedAt: string | null;
  countedCents: number | null;
  expectedCents: number | null;
  differenceCents: number | null;
  note: string | null;
}

export interface CashMovementDTO {
  id: string;
  type: "opening" | "payment" | "reversal" | "adjustment" | "closing";
  amountCents: number;
  note: string | null;
  createdAt: string;
}

export interface StudentHit {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  publicCode: string;
}

export interface PayableCharge {
  id: string;
  description: string;
  finalCents: number;
  remainingCents: number;
  dueDate: string;
  status: string;
  installmentNumber: number | null;
}
