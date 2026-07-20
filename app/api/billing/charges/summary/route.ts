import { NextResponse } from "next/server";
import { z } from "zod";
import { readSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation";
import { resolveMatchingStudentIds } from "@/lib/students/search";

const querySchema = z.object({
  academyId: uuidSchema,
  status: z.enum(["all", "pending", "partial", "paid", "overdue", "cancelled", "waived", "under_review"]).default("all"),
  q: z.string().max(80).optional()
});

export async function GET(request: Request) {
  const user = await readSession();
  if (!user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Academia inválida" }, { status: 400 });
  try {
    const supabase = await createSupabaseServerClient();
    const matchingStudentIds = await resolveMatchingStudentIds(supabase, user.workspaceId, parsed.data.academyId, parsed.data.q);
    if (matchingStudentIds?.length === 0) return NextResponse.json({ debtCents: 0, overdueCount: 0, pendingValidationCount: 0 });

    const { data, error } = await supabase.rpc("charges_summary", {
      p_workspace_id: user.workspaceId,
      p_academy_id: parsed.data.academyId,
      p_status: parsed.data.status === "all" ? undefined : parsed.data.status,
      p_student_ids: matchingStudentIds ?? undefined
    });
    if (error) return NextResponse.json({ error: "No se pudo calcular el resumen" }, { status: 500 });
    return NextResponse.json(data as { debtCents: number; overdueCount: number; pendingValidationCount: number });
  } catch { return NextResponse.json({ error: "El servicio de datos no está disponible." }, { status: 503 }); }
}
