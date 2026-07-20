import type { SupabaseClient } from "@supabase/supabase-js";

const excludedFromPaid = new Set(["rejected", "reversed", "refunded"]);

export interface AllocationState {
  paidCents: number;
  pendingPayment: { id: string; method: string } | null;
  confirmedPaymentId: string | null;
}

// Estado de cobro por cuota derivado de payment_allocations + payments: cuánto se pagó
// (solo confirmados), si hay una transferencia pendiente de validar, y el id del pago
// confirmado (para "Revertir"). Si hay más de un pago confirmado sobre la misma cuota,
// se queda con el último encontrado — misma simplificación que ya usaba el sistema demo.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadAllocationState(supabase: SupabaseClient<any>, chargeIds: string[]): Promise<Map<string, AllocationState>> {
  const result = new Map<string, AllocationState>();
  if (chargeIds.length === 0) return result;
  const { data: allocations } = await supabase
    .from("payment_allocations")
    .select("charge_id, amount_cents, payment_id")
    .in("charge_id", chargeIds);
  const paymentIds = Array.from(new Set((allocations ?? []).map((allocation) => allocation.payment_id)));
  const { data: payments } = paymentIds.length
    ? await supabase.from("payments").select("id, method, status").in("id", paymentIds)
    : { data: [] as { id: string; method: string; status: string }[] };
  const paymentById = new Map((payments ?? []).map((payment) => [payment.id, payment]));

  for (const allocation of allocations ?? []) {
    const payment = paymentById.get(allocation.payment_id);
    if (!payment) continue;
    const state = result.get(allocation.charge_id) ?? { paidCents: 0, pendingPayment: null, confirmedPaymentId: null };
    if (payment.status === "confirmed") {
      state.paidCents += allocation.amount_cents;
      state.confirmedPaymentId = payment.id;
    } else if (payment.status === "pending_validation") {
      state.pendingPayment = { id: payment.id, method: payment.method };
    } else if (!excludedFromPaid.has(payment.status)) {
      state.paidCents += allocation.amount_cents;
    }
    result.set(allocation.charge_id, state);
  }
  return result;
}
