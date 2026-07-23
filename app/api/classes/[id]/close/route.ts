import { NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/http/request";
import { readSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation";
import { mapRpcError } from "@/lib/billing/errors";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  const user = await readSession();
  if (!user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) return NextResponse.json({ error: "Clase inválida" }, { status: 400 });
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("close_attendance", { p_class_session_id: id });
    if (error) { const mapped = mapRpcError(error.message); return NextResponse.json({ error: mapped.error }, { status: mapped.status }); }
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "El servicio de datos no está disponible." }, { status: 503 }); }
}
