import { NextResponse } from "next/server";
import { z } from "zod";
import { readSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { StudentHit } from "@/lib/cash/types";
import { uuidSchema } from "@/lib/validation";
import { normalizeSearchText } from "@/lib/students/search";

const querySchema = z.object({ q: z.string().min(1).max(80), academyId: uuidSchema });

export async function GET(request: Request) {
  const user = await readSession();
  if (!user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Búsqueda inválida" }, { status: 400 });
  try {
    const supabase = await createSupabaseServerClient();
    // Se quitan % y , del término: rompen la sintaxis del filtro .or() de PostgREST.
    const term = parsed.data.q.replace(/[%,]/g, "").trim();
    if (!term) return NextResponse.json({ students: [] });
    const normalized = normalizeSearchText(term);
    const { data, error } = await supabase
      .from("students")
      .select("id, first_name, last_name, dni_normalized, public_code")
      .eq("workspace_id", user.workspaceId)
      .eq("academy_id", parsed.data.academyId)
      .eq("status", "active")
      .or(`first_name_search.ilike.%${normalized}%,last_name_search.ilike.%${normalized}%,dni_normalized.ilike.%${term}%,public_code.ilike.%${term}%`)
      .order("last_name")
      .limit(10);
    if (error) return NextResponse.json({ error: "No se pudo buscar alumnos" }, { status: 500 });
    const students: StudentHit[] = (data ?? []).map((row) => ({
      id: row.id, firstName: row.first_name, lastName: row.last_name, dni: row.dni_normalized, publicCode: row.public_code
    }));
    return NextResponse.json({ students });
  } catch { return NextResponse.json({ error: "El servicio de datos no está disponible." }, { status: 503 }); }
}
