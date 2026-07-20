import { NextResponse } from "next/server";
import { z } from "zod";
import { readSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CashMovementDTO } from "@/lib/cash/types";
import { uuidSchema } from "@/lib/validation";

const querySchema = z.object({ cashSessionId: uuidSchema });

export async function GET(request: Request) {
  const user = await readSession();
  if (!user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Sesión de caja inválida" }, { status: 400 });
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("cash_movements")
      .select("id, type, amount_cents, note, created_at")
      .eq("cash_session_id", parsed.data.cashSessionId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) return NextResponse.json({ error: "No se pudieron cargar los movimientos" }, { status: 500 });
    const movements: CashMovementDTO[] = (data ?? []).map((row) => ({
      id: row.id, type: row.type as CashMovementDTO["type"], amountCents: row.amount_cents, note: row.note, createdAt: row.created_at
    }));
    return NextResponse.json({ movements });
  } catch { return NextResponse.json({ error: "El servicio de datos no está disponible." }, { status: 503 }); }
}
