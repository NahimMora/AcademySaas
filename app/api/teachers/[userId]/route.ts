import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation";
import type { TeacherDetailDTO } from "@/lib/teachers/types";

const weekdayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export async function GET(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const user = await readSession();
  if (!user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { userId } = await params;
  if (!uuidSchema.safeParse(userId).success) return NextResponse.json({ error: "Profesor inválido" }, { status: 400 });
  // Un instructor solo puede ver su propio detalle.
  if (user.role === "instructor" && user.id !== userId) return NextResponse.json({ error: "No tenés acceso a este perfil" }, { status: 403 });

  try {
    const supabase = await createSupabaseServerClient();
    const { data: profileRow } = await supabase.from("profiles").select("id, full_name").eq("id", userId).maybeSingle();
    if (!profileRow) return NextResponse.json({ error: "Profesor no encontrado" }, { status: 404 });

    const { data: cohortRows } = await supabase.from("cohorts")
      .select("id, code, name, status, course_id, capacity")
      .eq("workspace_id", user.workspaceId).eq("instructor_user_id", userId).order("start_date", { ascending: false });

    const courseIds = Array.from(new Set((cohortRows ?? []).map((row) => row.course_id)));
    const { data: courseRows } = courseIds.length
      ? await supabase.from("courses").select("id, name").in("id", courseIds)
      : { data: [] as { id: string; name: string }[] };
    const courseNames = new Map((courseRows ?? []).map((row) => [row.id, row.name]));

    const cohortIds = (cohortRows ?? []).map((row) => row.id);
    const [{ data: enrollmentRows }, { data: scheduleRows }] = await Promise.all([
      cohortIds.length
        ? supabase.from("enrollments").select("cohort_id").in("cohort_id", cohortIds).not("status", "in", "(dropped_out,cancelled,expelled)")
        : Promise.resolve({ data: [] as { cohort_id: string }[] }),
      cohortIds.length
        ? supabase.from("cohort_schedule_days").select("cohort_id, weekday, starts_at, ends_at").in("cohort_id", cohortIds).order("weekday")
        : Promise.resolve({ data: [] as { cohort_id: string; weekday: number; starts_at: string; ends_at: string }[] })
    ]);
    const enrolledCounts = new Map<string, number>();
    for (const row of enrollmentRows ?? []) enrolledCounts.set(row.cohort_id, (enrolledCounts.get(row.cohort_id) ?? 0) + 1);
    const scheduleByCohort = new Map<string, string[]>();
    for (const row of scheduleRows ?? []) {
      const list = scheduleByCohort.get(row.cohort_id) ?? [];
      list.push(`${weekdayNames[row.weekday]} ${row.starts_at.slice(0, 5)}–${row.ends_at.slice(0, 5)}`);
      scheduleByCohort.set(row.cohort_id, list);
    }

    const teacher: TeacherDetailDTO = {
      userId: profileRow.id, fullName: profileRow.full_name,
      cohorts: (cohortRows ?? []).map((row) => ({
        id: row.id, code: row.code, name: row.name, courseName: courseNames.get(row.course_id) ?? "", status: row.status,
        enrolledCount: enrolledCounts.get(row.id) ?? 0, capacity: row.capacity,
        scheduleSummary: (scheduleByCohort.get(row.id) ?? []).join(" · ")
      }))
    };
    return NextResponse.json({ teacher });
  } catch { return NextResponse.json({ error: "El servicio de datos no está disponible." }, { status: 503 }); }
}
