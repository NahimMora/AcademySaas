import { NextResponse } from "next/server";
import { z } from "zod";
import { readSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation";
import type { ClassListItemDTO } from "@/lib/classes/types";

const querySchema = z.object({
  academyId: uuidSchema.optional(),
  cohortId: uuidSchema.optional(),
  dateFrom: z.iso.date().optional(),
  dateTo: z.iso.date().optional(),
  status: z.enum(["all", "scheduled", "open", "completed", "cancelled", "rescheduled", "extra"]).default("all"),
  sort: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25)
});

export async function GET(request: Request) {
  const user = await readSession();
  if (!user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  // academyId es obligatorio salvo para instructores: su resultado ya queda acotado a sus propias
  // comisiones más abajo, así que no necesitan indicar la academia de antemano.
  if (!parsed.data.academyId && user.role !== "instructor") return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  try {
    const supabase = await createSupabaseServerClient();
    let query = supabase.from("class_sessions")
      .select("id, cohort_id, session_date, starts_at, ends_at, status, attendance_closed_at, planned_instructor_id")
      .eq("workspace_id", user.workspaceId);
    if (parsed.data.academyId) query = query.eq("academy_id", parsed.data.academyId);
    if (parsed.data.status !== "all") query = query.eq("status", parsed.data.status);
    if (parsed.data.cohortId) query = query.eq("cohort_id", parsed.data.cohortId);
    if (parsed.data.dateFrom) query = query.gte("session_date", parsed.data.dateFrom);
    if (parsed.data.dateTo) query = query.lte("session_date", parsed.data.dateTo);
    // Un instructor solo ve sus propias clases.
    if (user.role === "instructor") {
      const { data: myCohorts } = await supabase.from("cohorts").select("id").eq("workspace_id", user.workspaceId).eq("instructor_user_id", user.id);
      const myCohortIds = (myCohorts ?? []).map((row) => row.id);
      if (myCohortIds.length === 0) return NextResponse.json({ classes: [], hasMore: false });
      query = query.in("cohort_id", myCohortIds);
    }

    const from = (parsed.data.page - 1) * parsed.data.pageSize;
    const ascending = parsed.data.sort === "asc";
    const { data: pageRows, error } = await query.order("session_date", { ascending }).order("starts_at", { ascending }).range(from, from + parsed.data.pageSize);
    if (error) return NextResponse.json({ error: "No se pudieron cargar las clases" }, { status: 500 });
    const hasMore = (pageRows ?? []).length > parsed.data.pageSize;
    const classRows = (pageRows ?? []).slice(0, parsed.data.pageSize);

    const cohortIds = Array.from(new Set(classRows.map((row) => row.cohort_id)));
    const { data: cohortRows } = cohortIds.length
      ? await supabase.from("cohorts").select("id, name, code").in("id", cohortIds)
      : { data: [] as { id: string; name: string; code: string }[] };
    const cohortById = new Map((cohortRows ?? []).map((row) => [row.id, row]));

    const instructorIds = Array.from(new Set(classRows.map((row) => row.planned_instructor_id).filter((id): id is string => Boolean(id))));
    const { data: instructorRows } = instructorIds.length
      ? await supabase.from("profiles").select("id, full_name").in("id", instructorIds)
      : { data: [] as { id: string; full_name: string }[] };
    const instructorNames = new Map((instructorRows ?? []).map((row) => [row.id, row.full_name]));

    const classes: ClassListItemDTO[] = classRows.map((row) => {
      const cohort = cohortById.get(row.cohort_id);
      return {
        id: row.id, cohortId: row.cohort_id, cohortName: cohort?.name ?? "", cohortCode: cohort?.code ?? "",
        sessionDate: row.session_date, startsAt: row.starts_at.slice(0, 5), endsAt: row.ends_at.slice(0, 5), status: row.status,
        instructorName: row.planned_instructor_id ? (instructorNames.get(row.planned_instructor_id) ?? null) : null,
        attendanceClosed: Boolean(row.attendance_closed_at)
      };
    });
    return NextResponse.json({ classes, hasMore });
  } catch { return NextResponse.json({ error: "El servicio de datos no está disponible." }, { status: 503 }); }
}
