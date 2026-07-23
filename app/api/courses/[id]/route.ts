import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation";
import type { CourseDetailDTO } from "@/lib/courses/types";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await readSession();
  if (!user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) return NextResponse.json({ error: "Curso inválido" }, { status: 400 });
  try {
    const supabase = await createSupabaseServerClient();
    const { data: courseRow } = await supabase.from("courses")
      .select("id, code, name, estimated_duration_weeks, default_installments, suggested_price_cents, currency, active")
      .eq("id", id).eq("workspace_id", user.workspaceId).maybeSingle();
    if (!courseRow) return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });

    const { data: cohortRows } = await supabase.from("cohorts")
      .select("id, code, name, status, start_date, estimated_end_date, capacity")
      .eq("course_id", id).eq("workspace_id", user.workspaceId).order("start_date", { ascending: false });

    const cohortIds = (cohortRows ?? []).map((row) => row.id);
    const { data: enrollmentRows } = cohortIds.length
      ? await supabase.from("enrollments").select("cohort_id").in("cohort_id", cohortIds).not("status", "in", "(dropped_out,cancelled,expelled)")
      : { data: [] as { cohort_id: string }[] };
    const enrolledCounts = new Map<string, number>();
    for (const row of enrollmentRows ?? []) enrolledCounts.set(row.cohort_id, (enrolledCounts.get(row.cohort_id) ?? 0) + 1);

    const course: CourseDetailDTO = {
      id: courseRow.id, code: courseRow.code, name: courseRow.name,
      estimatedDurationWeeks: courseRow.estimated_duration_weeks, defaultInstallments: courseRow.default_installments,
      suggestedPriceCents: courseRow.suggested_price_cents, currency: courseRow.currency, active: courseRow.active,
      cohorts: (cohortRows ?? []).map((row) => ({
        id: row.id, code: row.code, name: row.name, status: row.status, startDate: row.start_date, estimatedEndDate: row.estimated_end_date,
        capacity: row.capacity, enrolledCount: enrolledCounts.get(row.id) ?? 0
      }))
    };
    return NextResponse.json({ course });
  } catch { return NextResponse.json({ error: "El servicio de datos no está disponible." }, { status: 503 }); }
}
