import { NextResponse } from "next/server";
import { z } from "zod";
import { isSameOrigin } from "@/lib/http/request";
import { readSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation";
import { mapRpcError } from "@/lib/billing/errors";
import type { CohortOption } from "@/lib/billing/types";

const querySchema = z.object({
  academyId: uuidSchema,
  courseId: uuidSchema.optional(),
  instructorUserId: uuidSchema.optional(),
  status: z.enum(["all", "draft", "scheduled", "active", "paused", "finished", "cancelled", "archived"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(100)
});

const scheduleDaySchema = z.object({
  weekday: z.coerce.number().int().min(0).max(6),
  startsAt: z.string().regex(/^\d{2}:\d{2}$/),
  endsAt: z.string().regex(/^\d{2}:\d{2}$/)
});

const createSchema = z.object({
  academyId: uuidSchema,
  branchId: uuidSchema,
  courseId: uuidSchema,
  name: z.string().min(1).max(120),
  instructorUserId: uuidSchema.nullable().optional(),
  startDate: z.iso.date(),
  estimatedEndDate: z.iso.date(),
  capacity: z.coerce.number().int().min(1).max(500),
  installmentCount: z.coerce.number().int().min(1).max(60),
  installmentCents: z.coerce.number().int().min(0),
  dueDay: z.coerce.number().int().min(1).max(28),
  commissionBps: z.coerce.number().int().min(0).max(10000).default(4000),
  debtPolicy: z.enum(["inform_only", "allow_with_warning", "block_if_overdue", "block_if_no_confirmed_payment", "manual_review"]).default("allow_with_warning"),
  scheduleDays: z.array(scheduleDaySchema).min(1).max(7),
  idempotencyKey: z.string().min(1)
});

const weekdayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export async function GET(request: Request) {
  const user = await readSession();
  if (!user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  try {
    const supabase = await createSupabaseServerClient();
    let query = supabase.from("cohorts")
      .select("id, code, name, course_id, branch_id, instructor_user_id, start_date, estimated_end_date, status, capacity, installment_cents, installment_count")
      .eq("workspace_id", user.workspaceId)
      .eq("academy_id", parsed.data.academyId);

    if (parsed.data.status && parsed.data.status !== "all") query = query.eq("status", parsed.data.status);
    else if (!parsed.data.status) query = query.in("status", ["scheduled", "active"]);
    if (parsed.data.courseId) query = query.eq("course_id", parsed.data.courseId);
    // Un instructor solo ve sus propias comisiones, sin importar qué instructorUserId pida por query string.
    const instructorFilter = user.role === "instructor" ? user.id : parsed.data.instructorUserId;
    if (instructorFilter) query = query.eq("instructor_user_id", instructorFilter);

    const from = (parsed.data.page - 1) * parsed.data.pageSize;
    const { data: pageRows, error } = await query.order("name").range(from, from + parsed.data.pageSize);
    if (error) return NextResponse.json({ error: "No se pudieron cargar las comisiones" }, { status: 500 });
    const hasMore = (pageRows ?? []).length > parsed.data.pageSize;
    const cohortRows = (pageRows ?? []).slice(0, parsed.data.pageSize);

    const courseIds = Array.from(new Set(cohortRows.map((row) => row.course_id)));
    const { data: courseRows } = courseIds.length
      ? await supabase.from("courses").select("id, name").in("id", courseIds)
      : { data: [] as { id: string; name: string }[] };
    const courseNames = new Map((courseRows ?? []).map((course) => [course.id, course.name]));

    const branchIds = Array.from(new Set(cohortRows.map((row) => row.branch_id)));
    const { data: branchRows } = branchIds.length
      ? await supabase.from("branches").select("id, name").in("id", branchIds)
      : { data: [] as { id: string; name: string }[] };
    const branchNames = new Map((branchRows ?? []).map((branch) => [branch.id, branch.name]));

    const instructorIds = Array.from(new Set(cohortRows.map((row) => row.instructor_user_id).filter((id): id is string => Boolean(id))));
    const { data: instructorRows } = instructorIds.length
      ? await supabase.from("profiles").select("id, full_name").in("id", instructorIds)
      : { data: [] as { id: string; full_name: string }[] };
    const instructorNames = new Map((instructorRows ?? []).map((instructor) => [instructor.id, instructor.full_name]));

    const cohortIds = cohortRows.map((row) => row.id);
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
    const scheduleByCohort = new Map<string, { weekday: number; startsAt: string; endsAt: string }[]>();
    for (const row of scheduleRows ?? []) {
      const list = scheduleByCohort.get(row.cohort_id) ?? [];
      list.push({ weekday: row.weekday, startsAt: row.starts_at.slice(0, 5), endsAt: row.ends_at.slice(0, 5) });
      scheduleByCohort.set(row.cohort_id, list);
    }

    const cohorts: CohortOption[] = cohortRows.map((row) => {
      const schedule = scheduleByCohort.get(row.id) ?? [];
      return {
        id: row.id, code: row.code, name: row.name, courseId: row.course_id, courseName: courseNames.get(row.course_id) ?? "",
        branchId: row.branch_id, branchName: branchNames.get(row.branch_id) ?? "",
        instructorUserId: row.instructor_user_id, instructorName: row.instructor_user_id ? (instructorNames.get(row.instructor_user_id) ?? "") : null,
        startDate: row.start_date, estimatedEndDate: row.estimated_end_date, status: row.status,
        capacity: row.capacity, enrolledCount: enrolledCounts.get(row.id) ?? 0,
        installmentCents: row.installment_cents, installmentCount: row.installment_count,
        scheduleDays: schedule,
        scheduleSummary: schedule.map((day) => `${weekdayNames[day.weekday]} ${day.startsAt}–${day.endsAt}`).join(" · ")
      };
    });
    return NextResponse.json({ cohorts, hasMore });
  } catch { return NextResponse.json({ error: "El servicio de datos no está disponible." }, { status: 503 }); }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  const user = await readSession();
  if (!user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (user.role !== "owner") return NextResponse.json({ error: "Solo la propietaria puede crear comisiones." }, { status: 403 });
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos de comisión inválidos" }, { status: 400 });
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("create_cohort_with_classes", {
      p_workspace_id: user.workspaceId,
      p_academy_id: parsed.data.academyId,
      p_branch_id: parsed.data.branchId,
      p_course_id: parsed.data.courseId,
      p_name: parsed.data.name,
      p_instructor_user_id: (parsed.data.instructorUserId ?? null) as unknown as string,
      p_start_date: parsed.data.startDate,
      p_estimated_end_date: parsed.data.estimatedEndDate,
      p_capacity: parsed.data.capacity,
      p_installment_count: parsed.data.installmentCount,
      p_installment_cents: parsed.data.installmentCents,
      p_due_day: parsed.data.dueDay,
      p_commission_bps: parsed.data.commissionBps,
      p_debt_policy: parsed.data.debtPolicy,
      p_schedule_days: parsed.data.scheduleDays.map((day) => ({ weekday: day.weekday, startsAt: day.startsAt, endsAt: day.endsAt })),
      p_idempotency_key: parsed.data.idempotencyKey
    });
    if (error) { const mapped = mapRpcError(error.message); return NextResponse.json({ error: mapped.error }, { status: mapped.status }); }
    return NextResponse.json(data as { cohort_id: string; sessions_created?: number; idempotent: boolean }, { status: 201 });
  } catch { return NextResponse.json({ error: "El servicio de datos no está disponible." }, { status: 503 }); }
}
