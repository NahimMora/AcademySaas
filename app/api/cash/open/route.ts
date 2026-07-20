import { NextResponse } from "next/server";
import { z } from "zod";
import { isSameOrigin } from "@/lib/http/request";
import { readSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mapRpcError } from "@/lib/billing/errors";
import { uuidSchema } from "@/lib/validation";
import { log } from "@/lib/observability/logger";

const bodySchema = z.object({
  branchId: uuidSchema,
  academyId: uuidSchema,
  openingCents: z.number().int().min(0).max(100_000_000)
});

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  const user = await readSession();
  if (!user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos de apertura inválidos" }, { status: 400 });
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("open_cash_session", {
      p_workspace_id: user.workspaceId,
      p_academy_id: parsed.data.academyId,
      p_branch_id: parsed.data.branchId,
      p_opening_cents: parsed.data.openingCents
    });
    if (error) { const mapped = mapRpcError(error.message); return NextResponse.json({ error: mapped.error }, { status: mapped.status }); }
    log("info", "cash.session_opened", { workspaceId: user.workspaceId, branchId: parsed.data.branchId, userId: user.id });
    return NextResponse.json({ cashSessionId: data });
  } catch { return NextResponse.json({ error: "El servicio de datos no está disponible." }, { status: 503 }); }
}
