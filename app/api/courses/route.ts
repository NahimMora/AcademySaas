import { NextResponse } from "next/server";
import { z } from "zod";
import { readSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation";
import type { CourseOption } from "@/lib/billing/types";

const querySchema = z.object({ academyId: uuidSchema });

export async function GET(request: Request) {
  const user = await readSession();
  if (!user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Academia inválida" }, { status: 400 });
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("courses")
      .select("id, name, code")
      .eq("workspace_id", user.workspaceId)
      .eq("academy_id", parsed.data.academyId)
      .eq("active", true)
      .order("name");
    if (error) return NextResponse.json({ error: "No se pudieron cargar los cursos" }, { status: 500 });
    const courses: CourseOption[] = data ?? [];
    return NextResponse.json({ courses });
  } catch { return NextResponse.json({ error: "El servicio de datos no está disponible." }, { status: 503 }); }
}
