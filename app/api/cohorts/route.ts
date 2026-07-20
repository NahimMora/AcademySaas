import { NextResponse } from "next/server";
import { z } from "zod";
import { readSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation";
import type { CohortOption } from "@/lib/billing/types";

const querySchema = z.object({ academyId: uuidSchema, courseId: uuidSchema.optional() });

export async function GET(request: Request) {
  const user = await readSession();
  if (!user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  try {
    const supabase = await createSupabaseServerClient();
    let query = supabase.from("cohorts")
      .select("id, code, name, course_id, capacity, installment_cents, installment_count")
      .eq("workspace_id", user.workspaceId)
      .eq("academy_id", parsed.data.academyId)
      .in("status", ["scheduled", "active"]);
    if (parsed.data.courseId) query = query.eq("course_id", parsed.data.courseId);
    const { data: cohortRows, error } = await query.order("name");
    if (error) return NextResponse.json({ error: "No se pudieron cargar las comisiones" }, { status: 500 });

    const courseIds = Array.from(new Set((cohortRows ?? []).map((row) => row.course_id)));
    const { data: courseRows } = courseIds.length
      ? await supabase.from("courses").select("id, name").in("id", courseIds)
      : { data: [] as { id: string; name: string }[] };
    const courseNames = new Map((courseRows ?? []).map((course) => [course.id, course.name]));

    const cohortIds = (cohortRows ?? []).map((row) => row.id);
    const { data: enrollmentRows } = cohortIds.length
      ? await supabase.from("enrollments").select("cohort_id").in("cohort_id", cohortIds).not("status", "in", "(dropped_out,cancelled,expelled)")
      : { data: [] as { cohort_id: string }[] };
    const enrolledCounts = new Map<string, number>();
    for (const row of enrollmentRows ?? []) enrolledCounts.set(row.cohort_id, (enrolledCounts.get(row.cohort_id) ?? 0) + 1);

    const cohorts: CohortOption[] = (cohortRows ?? []).map((row) => ({
      id: row.id, code: row.code, name: row.name, courseId: row.course_id, courseName: courseNames.get(row.course_id) ?? "",
      capacity: row.capacity, enrolledCount: enrolledCounts.get(row.id) ?? 0,
      installmentCents: row.installment_cents, installmentCount: row.installment_count
    }));
    return NextResponse.json({ cohorts });
  } catch { return NextResponse.json({ error: "El servicio de datos no está disponible." }, { status: 503 }); }
}
