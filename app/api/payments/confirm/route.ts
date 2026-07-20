import { NextResponse } from "next/server";
import { z } from "zod";
import { isSameOrigin } from "@/lib/http/request";
import { readSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation";
import { mapRpcError } from "@/lib/billing/errors";
import { log } from "@/lib/observability/logger";

const bodySchema = z.object({ paymentId: uuidSchema, idempotencyKey: z.string().min(10).max(100) });

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  const user = await readSession();
  if (!user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("confirm_payment", { p_payment_id: parsed.data.paymentId, p_idempotency_key: parsed.data.idempotencyKey });
    if (error) { const mapped = mapRpcError(error.message); return NextResponse.json({ error: mapped.error }, { status: mapped.status }); }
    const result = data as { payment_id: string; status: string; idempotent: boolean };
    log("info", "payments.confirmed", { workspaceId: user.workspaceId, paymentId: parsed.data.paymentId });
    return NextResponse.json({ paymentId: result.payment_id, status: result.status, idempotent: result.idempotent });
  } catch { return NextResponse.json({ error: "El servicio de datos no está disponible." }, { status: 503 }); }
}
