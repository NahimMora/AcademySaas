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
  countedCents: z.number().int().min(0),
  note: z.string().max(500).optional()
});

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  const user = await readSession();
  if (!user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos de cierre inválidos" }, { status: 400 });
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("close_cash_session", {
      p_cash_session_id: parsed.data.cashSessionId,
      p_counted_cents: parsed.data.countedCents,
      p_note: parsed.data.note ?? ""
    });
    if (error) { const mapped = mapRpcError(error.message); return NextResponse.json({ error: mapped.error }, { status: mapped.status }); }
    const result = data as { cash_session_id: string; expected_cents: number; difference_cents: number };
    log("info", "cash.session_closed", { workspaceId: user.workspaceId, cashSessionId: parsed.data.cashSessionId, differenceCents: result.difference_cents });
    return NextResponse.json({ cashSessionId: result.cash_session_id, expectedCents: result.expected_cents, differenceCents: result.difference_cents });
  } catch { return NextResponse.json({ error: "El servicio de datos no está disponible." }, { status: 503 }); }
}
