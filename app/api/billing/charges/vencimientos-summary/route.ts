import { NextResponse } from "next/server";
import { z } from "zod";
import { readSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation";
import { mapRpcError } from "@/lib/billing/errors";

const querySchema = z.object({ academyId: uuidSchema });

type BucketSummary = { count: number; cents: number };
export type VencimientosSummary = { overdue: BucketSummary; next7Days: BucketSummary; next2Weeks: BucketSummary; later: BucketSummary };

export async function GET(request: Request) {
  const user = await readSession();
  if (!user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Academia inválida" }, { status: 400 });
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("charges_vencimientos_summary", { p_workspace_id: user.workspaceId, p_academy_id: parsed.data.academyId });
    if (error) { const mapped = mapRpcError(error.message); return NextResponse.json({ error: mapped.error }, { status: mapped.status }); }
    return NextResponse.json(data as VencimientosSummary);
  } catch { return NextResponse.json({ error: "El servicio de datos no está disponible." }, { status: 503 }); }
}
