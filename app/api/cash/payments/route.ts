import { NextResponse } from "next/server";
import { z } from "zod";
import { isSameOrigin } from "@/lib/http/request";
import { readSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mapRpcError } from "@/lib/billing/errors";
import { uuidSchema } from "@/lib/validation";
import { log } from "@/lib/observability/logger";

const bodySchema = z.object({
  cashSessionId: uuidSchema,
  branchId: uuidSchema,
  academyId: uuidSchema,
  studentId: uuidSchema,
  amountCents: z.number().int().positive(),
  chargeId: uuidSchema.optional(),
  allocationCents: z.number().int().min(0).optional(),
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
    // p_charge_id / p_reference se tipan como `string` (no nullable) en database.types.ts porque el
    // generador no refleja la nulabilidad de parámetros de función Postgres; el RPC sí acepta null.
    const { data, error } = await supabase.rpc("register_payment", {
      p_workspace_id: user.workspaceId,
      p_academy_id: parsed.data.academyId,
      p_branch_id: parsed.data.branchId,
      p_student_id: parsed.data.studentId,
      p_amount_cents: parsed.data.amountCents,
      p_method: "cash",
      p_effective_at: new Date().toISOString(),
      p_reference: (parsed.data.reference ?? null) as unknown as string,
      p_charge_id: (parsed.data.chargeId ?? null) as unknown as string,
      p_allocation_cents: parsed.data.chargeId ? (parsed.data.allocationCents ?? parsed.data.amountCents) : 0,
      p_cash_session_id: parsed.data.cashSessionId,
      p_idempotency_key: parsed.data.idempotencyKey
    });
    if (error) { const mapped = mapRpcError(error.message); return NextResponse.json({ error: mapped.error }, { status: mapped.status }); }
    const result = data as { payment_id: string; status: string; idempotent: boolean };
    log("info", "cash.payment_registered", { workspaceId: user.workspaceId, cashSessionId: parsed.data.cashSessionId, studentId: parsed.data.studentId });
    return NextResponse.json({ paymentId: result.payment_id, status: result.status, idempotent: result.idempotent });
  } catch { return NextResponse.json({ error: "El servicio de datos no está disponible." }, { status: 503 }); }
}
