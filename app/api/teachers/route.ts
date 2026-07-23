import { NextResponse } from "next/server";
import { z } from "zod";
import { readSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation";
import type { TeacherListItemDTO } from "@/lib/teachers/types";

const querySchema = z.object({ academyId: uuidSchema });

export async function GET(request: Request) {
  const user = await readSession();
  if (!user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Academia inválida" }, { status: 400 });
  try {
    const supabase = await createSupabaseServerClient();
    const { data: instructorRows, error } = await supabase.from("instructor_profiles")
      .select("user_id")
      .eq("workspace_id", user.workspaceId).eq("academy_id", parsed.data.academyId).eq("active", true);
    if (error) return NextResponse.json({ error: "No se pudieron cargar los profesores" }, { status: 500 });

    const userIds = (instructorRows ?? []).map((row) => row.user_id);
    const { data: profileRows } = userIds.length
      ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
      : { data: [] as { id: string; full_name: string }[] };
    const fullNameById = new Map((profileRows ?? []).map((row) => [row.id, row.full_name]));

    const { data: cohortRows } = userIds.length
      ? await supabase.from("cohorts").select("id, instructor_user_id, capacity").eq("academy_id", parsed.data.academyId).in("instructor_user_id", userIds)
      : { data: [] as { id: string; instructor_user_id: string | null; capacity: number }[] };
    const cohortIds = (cohortRows ?? []).map((row) => row.id);
    const { data: enrollmentRows } = cohortIds.length
      ? await supabase.from("enrollments").select("cohort_id").in("cohort_id", cohortIds).not("status", "in", "(dropped_out,cancelled,expelled)")
      : { data: [] as { cohort_id: string }[] };
    const enrolledByCohort = new Map<string, number>();
    for (const row of enrollmentRows ?? []) enrolledByCohort.set(row.cohort_id, (enrolledByCohort.get(row.cohort_id) ?? 0) + 1);

    const teachers: TeacherListItemDTO[] = userIds.map((userId) => {
      const mine = (cohortRows ?? []).filter((row) => row.instructor_user_id === userId);
      return {
        userId, fullName: fullNameById.get(userId) ?? "",
        cohortCount: mine.length,
        enrolledCount: mine.reduce((sum, row) => sum + (enrolledByCohort.get(row.id) ?? 0), 0),
        capacity: mine.reduce((sum, row) => sum + row.capacity, 0)
      };
    }).sort((a, b) => a.fullName.localeCompare(b.fullName));

    return NextResponse.json({ teachers });
  } catch { return NextResponse.json({ error: "El servicio de datos no está disponible." }, { status: 503 }); }
}
