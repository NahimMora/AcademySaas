import { NextResponse } from "next/server";
import { z } from "zod";
import { readSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CashSessionDTO } from "@/lib/cash/types";
import { uuidSchema } from "@/lib/validation";

const querySchema = z.object({ branchId: uuidSchema });

function toDto(row: {
  id: string; branch_id: string; academy_id: string; opened_by: string; opened_at: string; opening_cents: number;
  status: string; closed_at: string | null; counted_cents: number | null; expected_cents: number | null; difference_cents: number | null; note: string | null;
}): CashSessionDTO {
  return {
    id: row.id, branchId: row.branch_id, academyId: row.academy_id, openedBy: row.opened_by, openedAt: row.opened_at,
    openingCents: row.opening_cents, status: row.status as "open" | "closed", closedAt: row.closed_at,
    countedCents: row.counted_cents, expectedCents: row.expected_cents, differenceCents: row.difference_cents, note: row.note
  };
}

export async function GET(request: Request) {
  const user = await readSession();
  if (!user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Sede inválida" }, { status: 400 });
  try {
    const supabase = await createSupabaseServerClient();
    const [{ data: openRow, error: openError }, { data: recentRows, error: recentError }] = await Promise.all([
      supabase.from("cash_sessions").select("*").eq("branch_id", parsed.data.branchId).eq("status", "open").eq("opened_by", user.id).maybeSingle(),
      supabase.from("cash_sessions").select("*").eq("branch_id", parsed.data.branchId).eq("status", "closed").order("closed_at", { ascending: false }).limit(10)
    ]);
    if (openError || recentError) return NextResponse.json({ error: "No se pudo cargar el estado de la caja" }, { status: 500 });
    return NextResponse.json({ open: openRow ? toDto(openRow) : null, recent: (recentRows ?? []).map(toDto) });
  } catch { return NextResponse.json({ error: "El servicio de datos no está disponible." }, { status: 503 }); }
}
