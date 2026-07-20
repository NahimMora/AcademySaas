import { NextResponse } from "next/server";
import { z } from "zod";
import { readSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PayableCharge } from "@/lib/cash/types";
import { uuidSchema } from "@/lib/validation";

const querySchema = z.object({ studentId: uuidSchema });
const excludedFromAllocation = new Set(["rejected", "reversed", "refunded"]);

export async function GET(request: Request) {
  const user = await readSession();
  if (!user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Alumno inválido" }, { status: 400 });
  try {
    const supabase = await createSupabaseServerClient();
    const { data: charges, error } = await supabase
      .from("charges")
      .select("id, description, final_cents, due_date, status, installment_number")
      .eq("workspace_id", user.workspaceId)
      .eq("student_id", parsed.data.studentId)
      .not("status", "in", "(paid,cancelled,waived)")
      .order("due_date");
    if (error) return NextResponse.json({ error: "No se pudieron cargar las cuotas" }, { status: 500 });

    const chargeIds = (charges ?? []).map((charge) => charge.id);
    const { data: allocations } = chargeIds.length
      ? await supabase.from("payment_allocations").select("charge_id, amount_cents, payment_id").in("charge_id", chargeIds)
      : { data: [] as { charge_id: string; amount_cents: number; payment_id: string }[] };
    const paymentIds = Array.from(new Set((allocations ?? []).map((allocation) => allocation.payment_id)));
    const { data: payments } = paymentIds.length
      ? await supabase.from("payments").select("id, status").in("id", paymentIds)
      : { data: [] as { id: string; status: string }[] };
    const paymentStatusById = new Map((payments ?? []).map((payment) => [payment.id, payment.status]));

    const allocatedByCharge = new Map<string, number>();
    for (const allocation of allocations ?? []) {
      const status = paymentStatusById.get(allocation.payment_id);
      if (status && excludedFromAllocation.has(status)) continue;
      allocatedByCharge.set(allocation.charge_id, (allocatedByCharge.get(allocation.charge_id) ?? 0) + allocation.amount_cents);
    }

    const result: PayableCharge[] = (charges ?? []).map((charge) => ({
      id: charge.id,
      description: charge.description,
      finalCents: charge.final_cents ?? 0,
      remainingCents: Math.max(0, (charge.final_cents ?? 0) - (allocatedByCharge.get(charge.id) ?? 0)),
      dueDate: charge.due_date,
      status: charge.status,
      installmentNumber: charge.installment_number
    }));
    return NextResponse.json({ charges: result });
  } catch { return NextResponse.json({ error: "El servicio de datos no está disponible." }, { status: 503 }); }
}
