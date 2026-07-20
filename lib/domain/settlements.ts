import type { DemoState } from "@/lib/domain/types";

// Base comisionable de un profesor: pagos confirmados y asignados a un cargo
// de una comisión que dicta ese profesor, ponderados por el commissionBps de
// cada comisión (no una tasa fija). `sinceIso` filtra solo lo acreditado
// después del último cierre, para no contar dos veces un período ya cerrado.
export function settlementBase(state: DemoState, instructor: string, sinceIso?: string) {
  const cohortById = new Map(state.cohorts.map((cohort) => [cohort.id, cohort]));
  const cohortByEnrollment = new Map(state.enrollments.map((enrollment) => [enrollment.id, cohortById.get(enrollment.cohortId)]));
  const cohortByCharge = new Map(state.charges.map((charge) => [charge.id, cohortByEnrollment.get(charge.enrollmentId)]));
  let baseCents = 0;
  let commissionCents = 0;
  for (const payment of state.payments) {
    if (payment.status !== "confirmed" || !payment.allocationChargeId) continue;
    if (sinceIso && payment.registeredAt <= sinceIso) continue;
    const cohort = cohortByCharge.get(payment.allocationChargeId);
    if (!cohort || cohort.instructor !== instructor) continue;
    baseCents += payment.amountCents;
    commissionCents += Math.round((payment.amountCents * cohort.commissionBps) / 10_000);
  }
  return { baseCents, commissionCents };
}
