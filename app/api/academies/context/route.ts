import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await readSession();
  if (!user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("academies")
      .select("id, name")
      .eq("workspace_id", user.workspaceId)
      .eq("status", "active")
      .order("name");
    if (error) return NextResponse.json({ error: "No se pudieron cargar las academias" }, { status: 500 });
    return NextResponse.json({ academies: data ?? [] });
  } catch { return NextResponse.json({ error: "El servicio de datos no está disponible." }, { status: 503 }); }
}
