import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation";
import { loadAllocationState } from "@/lib/billing/allocations";
import type { CohortDetailDTO } from "@/lib/cohorts/types";

const weekdayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await readSession();
  if (!user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) return NextResponse.json({ error: "Comisión inválida" }, { status: 400 });
  try {
    const supabase = await createSupabaseServerClient();
    const { data: cohortRow } = await supabase.from("cohorts")
      .select("id, academy_id, code, name, status, course_id, branch_id, instructor_user_id, start_date, estimated_end_date, capacity, installment_count, installment_cents, due_day, commission_bps, debt_policy")
      .eq("id", id).eq("workspace_id", user.workspaceId).maybeSingle();
    if (!cohortRow) return NextResponse.json({ error: "Comisión no encontrada" }, { status: 404 });
    // Un instructor solo puede ver el detalle de sus propias comisiones asignadas.
    if (user.role === "instructor" && cohortRow.instructor_user_id !== user.id) {
      return NextResponse.json({ error: "No tenés acceso a esta comisión" }, { status: 403 });
    }

    const [{ data: courseRow }, { data: branchRow }, { data: scheduleRows }] = await Promise.all([
      supabase.from("courses").select("name").eq("id", cohortRow.course_id).maybeSingle(),
      supabase.from("branches").select("name").eq("id", cohortRow.branch_id).maybeSingle(),
      supabase.from("cohort_schedule_days").select("weekday, starts_at, ends_at").eq("cohort_id", id).order("weekday")
    ]);
    const instructorName = cohortRow.instructor_user_id
      ? (await supabase.from("profiles").select("full_name").eq("id", cohortRow.instructor_user_id).maybeSingle()).data?.full_name ?? null
      : null;

    const { data: enrollmentRows } = await supabase.from("enrollments")
      .select("id, student_id, status")
      .eq("cohort_id", id).not("status", "in", "(dropped_out,cancelled,expelled)");

    const studentIds = (enrollmentRows ?? []).map((row) => row.student_id);
    const { data: studentRows } = studentIds.length
      ? await supabase.from("students").select("id, first_name, last_name, public_code").in("id", studentIds)
      : { data: [] as { id: string; first_name: string; last_name: string; public_code: string }[] };
    const studentById = new Map((studentRows ?? []).map((row) => [row.id, row]));

    const enrollmentIds = (enrollmentRows ?? []).map((row) => row.id);
    const { data: chargeRows } = enrollmentIds.length
      ? await supabase.from("charges").select("id, enrollment_id, final_cents").in("enrollment_id", enrollmentIds)
      : { data: [] as { id: string; enrollment_id: string; final_cents: number | null }[] };
    const chargeIds = (chargeRows ?? []).map((row) => row.id);
    const allocationState = await loadAllocationState(supabase, chargeIds);
    const balanceByEnrollment = new Map<string, number>();
    for (const charge of chargeRows ?? []) {
      if (!charge.enrollment_id) continue;
      const paid = allocationState.get(charge.id)?.paidCents ?? 0;
      const balance = Math.max(0, (charge.final_cents ?? 0) - paid);
      balanceByEnrollment.set(charge.enrollment_id, (balanceByEnrollment.get(charge.enrollment_id) ?? 0) + balance);
    }

    const scheduleDays = (scheduleRows ?? []).map((row) => ({ weekday: row.weekday, startsAt: row.starts_at.slice(0, 5), endsAt: row.ends_at.slice(0, 5) }));

    const cohort: CohortDetailDTO = {
      id: cohortRow.id, academyId: cohortRow.academy_id, code: cohortRow.code, name: cohortRow.name, status: cohortRow.status,
      courseId: cohortRow.course_id, courseName: courseRow?.name ?? "",
      branchId: cohortRow.branch_id, branchName: branchRow?.name ?? "",
      instructorUserId: cohortRow.instructor_user_id, instructorName,
      startDate: cohortRow.start_date, estimatedEndDate: cohortRow.estimated_end_date,
      capacity: cohortRow.capacity, installmentCount: cohortRow.installment_count, installmentCents: cohortRow.installment_cents,
      dueDay: cohortRow.due_day, commissionBps: cohortRow.commission_bps, debtPolicy: cohortRow.debt_policy,
      scheduleDays,
      scheduleSummary: scheduleDays.map((day) => `${weekdayNames[day.weekday]} ${day.startsAt}–${day.endsAt}`).join(" · "),
      roster: (enrollmentRows ?? []).map((row) => {
        const student = studentById.get(row.student_id);
        return {
          enrollmentId: row.id, studentId: row.student_id,
          studentName: student ? `${student.last_name}, ${student.first_name}` : "", studentCode: student?.public_code ?? "",
          status: row.status, balanceCents: balanceByEnrollment.get(row.id) ?? 0
        };
      })
    };
    return NextResponse.json({ cohort });
  } catch { return NextResponse.json({ error: "El servicio de datos no está disponible." }, { status: 503 }); }
}
