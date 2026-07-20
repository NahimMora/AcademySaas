import { NextResponse } from "next/server";
import { z } from "zod";
import { readSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation";
import { loadAllocationState } from "@/lib/billing/allocations";
import { resolveMatchingStudentIds } from "@/lib/students/search";
import type { EnrollmentRowDTO } from "@/lib/billing/types";

const querySchema = z.object({
  academyId: uuidSchema,
  status: z.enum(["all", "pre_enrolled", "pending_payment", "confirmed", "attending", "suspended", "overdue", "dropped_out", "completed", "cancelled", "expelled"]).default("all"),
  q: z.string().max(80).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25)
});

export async function GET(request: Request) {
  const user = await readSession();
  if (!user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Academia inválida" }, { status: 400 });
  try {
    const supabase = await createSupabaseServerClient();

    const matchingStudentIds = await resolveMatchingStudentIds(supabase, user.workspaceId, parsed.data.academyId, parsed.data.q);
    if (matchingStudentIds?.length === 0) return NextResponse.json({ enrollments: [], hasMore: false });

    let query = supabase.from("enrollments")
      .select("id,student_id,cohort_id,agreed_price_cents,installment_count,status")
      .eq("workspace_id", user.workspaceId)
      .eq("academy_id", parsed.data.academyId);
    if (parsed.data.status !== "all") query = query.eq("status", parsed.data.status);
    if (matchingStudentIds) query = query.in("student_id", matchingStudentIds);

    const from = (parsed.data.page - 1) * parsed.data.pageSize;
    const { data: pageRows, error } = await query.order("created_at", { ascending: false }).range(from, from + parsed.data.pageSize);
    if (error) return NextResponse.json({ error: "No se pudieron cargar las inscripciones" }, { status: 500 });
    const hasMore = (pageRows ?? []).length > parsed.data.pageSize;
    const enrollmentRows = (pageRows ?? []).slice(0, parsed.data.pageSize);

    const studentIds = Array.from(new Set((enrollmentRows ?? []).map((row) => row.student_id)));
    const { data: studentRows } = studentIds.length
      ? await supabase.from("students").select("id, first_name, last_name").in("id", studentIds)
      : { data: [] as { id: string; first_name: string; last_name: string }[] };
    const studentById = new Map((studentRows ?? []).map((row) => [row.id, row]));

    const cohortIds = Array.from(new Set((enrollmentRows ?? []).map((row) => row.cohort_id)));
    const { data: cohortRows } = cohortIds.length
      ? await supabase.from("cohorts").select("id, name").in("id", cohortIds)
      : { data: [] as { id: string; name: string }[] };
    const cohortNames = new Map((cohortRows ?? []).map((row) => [row.id, row.name]));

    const enrollmentIds = (enrollmentRows ?? []).map((row) => row.id);
    const { data: chargeRows } = enrollmentIds.length
      ? await supabase.from("charges").select("id, enrollment_id, final_cents").in("enrollment_id", enrollmentIds)
      : { data: [] as { id: string; enrollment_id: string; final_cents: number | null }[] };
    const chargeIds = (chargeRows ?? []).map((row) => row.id);
    const allocationState = await loadAllocationState(supabase, chargeIds);

    const chargesByEnrollment = new Map<string, { finalCents: number; paidCents: number }[]>();
    for (const charge of chargeRows ?? []) {
      if (!charge.enrollment_id) continue;
      const list = chargesByEnrollment.get(charge.enrollment_id) ?? [];
      list.push({ finalCents: charge.final_cents ?? 0, paidCents: allocationState.get(charge.id)?.paidCents ?? 0 });
      chargesByEnrollment.set(charge.enrollment_id, list);
    }

    const enrollments: EnrollmentRowDTO[] = (enrollmentRows ?? []).map((row) => {
      const student = studentById.get(row.student_id);
      const charges = chargesByEnrollment.get(row.id) ?? [];
      const chargesPaid = charges.filter((charge) => charge.paidCents >= charge.finalCents).length;
      const balanceCents = charges.reduce((sum, charge) => sum + Math.max(0, charge.finalCents - charge.paidCents), 0);
      return {
        id: row.id, studentId: row.student_id, studentName: student ? `${student.last_name}, ${student.first_name}` : "",
        cohortName: cohortNames.get(row.cohort_id) ?? "", agreedPriceCents: row.agreed_price_cents, installmentCount: row.installment_count,
        status: row.status, chargesTotal: charges.length, chargesPaid, balanceCents
      };
    });
    return NextResponse.json({ enrollments, hasMore });
  } catch { return NextResponse.json({ error: "El servicio de datos no está disponible." }, { status: 503 }); }
}
