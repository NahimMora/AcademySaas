import { NextResponse } from "next/server";
import { z } from "zod";
import { isSameOrigin } from "@/lib/http/request";
import { readSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation";
import { mapRpcError } from "@/lib/billing/errors";
import { log } from "@/lib/observability/logger";

const bodySchema = z.object({
  studentId: uuidSchema,
  academyId: uuidSchema,
  amountCents: z.number().int().positive(),
  method: z.enum(["bank_transfer", "mercado_pago", "debit_card", "credit_card", "other"]),
  chargeId: uuidSchema.optional(),
  allocationCents: z.number().int().min(0).optional(),
  branchId: uuidSchema.optional(),
  reference: z.string().max(120).optional(),
  idempotencyKey: z.string().min(10).max(100)
}).refine((body) => body.allocationCents === undefined || body.allocationCents <= body.amountCents, { message: "La asignación no puede superar el importe" });

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  const user = await readSession();
  if (!user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos de cobro inválidos" }, { status: 400 });

  try {
    const supabase = await createSupabaseServerClient();

    let branchId = parsed.data.branchId ?? null;
    if (parsed.data.chargeId) {
      const { data: chargeRow } = await supabase.from("charges").select("enrollment_id").eq("id", parsed.data.chargeId).maybeSingle();
      if (chargeRow?.enrollment_id) {
        const { data: enrollmentRow } = await supabase.from("enrollments").select("branch_id").eq("id", chargeRow.enrollment_id).maybeSingle();
        branchId = enrollmentRow?.branch_id ?? branchId;
      }
    }
    if (!branchId) return NextResponse.json({ error: "Elegí una sede" }, { status: 400 });

    const { data, error } = await supabase.rpc("register_payment", {
      p_workspace_id: user.workspaceId,
      p_academy_id: parsed.data.academyId,
      p_branch_id: branchId,
      p_student_id: parsed.data.studentId,
      p_amount_cents: parsed.data.amountCents,
      p_method: parsed.data.method,
      p_effective_at: new Date().toISOString(),
      p_reference: (parsed.data.reference ?? null) as unknown as string,
      p_charge_id: (parsed.data.chargeId ?? null) as unknown as string,
      p_allocation_cents: parsed.data.chargeId ? (parsed.data.allocationCents ?? parsed.data.amountCents) : 0,
      p_cash_session_id: null as unknown as string,
      p_idempotency_key: parsed.data.idempotencyKey
    });
    if (error) { const mapped = mapRpcError(error.message); return NextResponse.json({ error: mapped.error }, { status: mapped.status }); }
    const result = data as { payment_id: string; status: string; idempotent: boolean };
    log("info", "payments.registered", { workspaceId: user.workspaceId, studentId: parsed.data.studentId, method: parsed.data.method });
    return NextResponse.json({ paymentId: result.payment_id, status: result.status, idempotent: result.idempotent });
  } catch { return NextResponse.json({ error: "El servicio de datos no está disponible." }, { status: 503 }); }
}
