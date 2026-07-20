import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BranchOption } from "@/lib/cash/types";

export async function GET() {
  const user = await readSession();
  if (!user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const supabase = await createSupabaseServerClient();
    const { data: branchRows, error } = await supabase
      .from("branches")
      .select("id, name, academy_id")
      .eq("workspace_id", user.workspaceId)
      .eq("status", "active")
      .order("name");
    if (error) return NextResponse.json({ error: "No se pudieron cargar las sedes" }, { status: 500 });
    const academyIds = Array.from(new Set((branchRows ?? []).map((row) => row.academy_id)));
    const { data: academyRows } = academyIds.length
      ? await supabase.from("academies").select("id, name").in("id", academyIds)
      : { data: [] as { id: string; name: string }[] };
    const academyNames = new Map((academyRows ?? []).map((academy) => [academy.id, academy.name]));
    const branches: BranchOption[] = (branchRows ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      academyId: row.academy_id,
      academyName: academyNames.get(row.academy_id) ?? ""
    }));
    return NextResponse.json({ branches });
  } catch { return NextResponse.json({ error: "El servicio de datos no está disponible." }, { status: 503 }); }
}
