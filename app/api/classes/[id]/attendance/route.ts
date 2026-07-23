import { NextResponse } from "next/server";
import { z } from "zod";
import { isSameOrigin } from "@/lib/http/request";
import { readSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation";
import { mapRpcError } from "@/lib/billing/errors";

const bodySchema = z.object({
  enrollmentId: uuidSchema,
  status: z.enum(["present", "absent", "late", "justified", "left_early", "not_applicable"]),
  notes: z.string().max(500).optional()
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  const user = await readSession();
  if (!user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) return NextResponse.json({ error: "Clase inválida" }, { status: 400 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos de asistencia inválidos" }, { status: 400 });
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("save_attendance", {
      p_class_session_id: id, p_enrollment_id: parsed.data.enrollmentId, p_status: parsed.data.status, p_notes: parsed.data.notes ?? ""
    });
    if (error) { const mapped = mapRpcError(error.message); return NextResponse.json({ error: mapped.error }, { status: mapped.status }); }
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "El servicio de datos no está disponible." }, { status: 503 }); }
}
