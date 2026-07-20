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
  cohortId: uuidSchema,
  agreedPriceCents: z.number().int().min(0),
  installmentCount: z.number().int().min(1).max(24),
  idempotencyKey: z.string().min(10).max(100)
});

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  const user = await readSession();
  if (!user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos de inscripción inválidos" }, { status: 400 });
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("create_enrollment_with_charges", {
      p_workspace_id: user.workspaceId,
      p_student_id: parsed.data.studentId,
      p_cohort_id: parsed.data.cohortId,
      p_agreed_price_cents: parsed.data.agreedPriceCents,
      p_installment_count: parsed.data.installmentCount,
      p_effective_start: new Date().toISOString().slice(0, 10),
      p_idempotency_key: parsed.data.idempotencyKey
    });
    if (error) { const mapped = mapRpcError(error.message); return NextResponse.json({ error: mapped.error }, { status: mapped.status }); }
    const result = data as { enrollment_id: string; charges_created: number; idempotent: boolean };
    log("info", "enrollments.created", { workspaceId: user.workspaceId, studentId: parsed.data.studentId, cohortId: parsed.data.cohortId });
    return NextResponse.json({ enrollmentId: result.enrollment_id, chargesCreated: result.charges_created, idempotent: result.idempotent });
  } catch { return NextResponse.json({ error: "El servicio de datos no está disponible." }, { status: 503 }); }
}
