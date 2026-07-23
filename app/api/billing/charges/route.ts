import { NextResponse } from "next/server";
import { z } from "zod";
import { readSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation";
import { loadAllocationState } from "@/lib/billing/allocations";
import { resolveMatchingStudentIds } from "@/lib/students/search";
import type { ChargeRowDTO } from "@/lib/students/types";

const querySchema = z.object({
  academyId: uuidSchema,
  status: z.enum(["all", "pending", "partial", "paid", "overdue", "cancelled", "waived", "under_review"]).default("all"),
  q: z.string().max(80).optional(),
  dueBucket: z.enum(["overdue", "next7Days", "next2Weeks", "later"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25)
});

// Ventana rodante en huso horario de negocio (mismo criterio hardcodeado que perform_checkin: deuda
// técnica heredada, no nueva). "Hoy" cae en next7Days, nunca en overdue.
function businessToday(): Date {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return new Date(`${parts}T00:00:00Z`);
}
function addDays(date: Date, days: number): string { const d = new Date(date); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); }
function dueBucketRange(bucket: "overdue" | "next7Days" | "next2Weeks" | "later"): { gte?: string; lt?: string } {
  const today = businessToday();
  if (bucket === "overdue") return { lt: addDays(today, 0) };
  if (bucket === "next7Days") return { gte: addDays(today, 0), lt: addDays(today, 7) };
  if (bucket === "next2Weeks") return { gte: addDays(today, 7), lt: addDays(today, 21) };
  return { gte: addDays(today, 21) };
}

export async function GET(request: Request) {
  const user = await readSession();
  if (!user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Academia inválida" }, { status: 400 });
  try {
    const supabase = await createSupabaseServerClient();

    const matchingStudentIds = await resolveMatchingStudentIds(supabase, user.workspaceId, parsed.data.academyId, parsed.data.q);
    if (matchingStudentIds?.length === 0) return NextResponse.json({ charges: [], hasMore: false });

    let query = supabase.from("charges")
      .select("id,description,final_cents,due_date,status,student_id")
      .eq("workspace_id", user.workspaceId)
      .eq("academy_id", parsed.data.academyId);
    if (parsed.data.status !== "all") query = query.eq("status", parsed.data.status);
    else if (parsed.data.dueBucket) query = query.not("status", "in", "(paid,cancelled,waived)");
    if (matchingStudentIds) query = query.in("student_id", matchingStudentIds);
    if (parsed.data.dueBucket) {
      const range = dueBucketRange(parsed.data.dueBucket);
      if (range.gte) query = query.gte("due_date", range.gte);
      if (range.lt) query = query.lt("due_date", range.lt);
    }

    const from = (parsed.data.page - 1) * parsed.data.pageSize;
    const { data: pageRows, error } = await query.order("due_date").range(from, from + parsed.data.pageSize);
    if (error) return NextResponse.json({ error: "No se pudieron cargar las cuotas" }, { status: 500 });
    const hasMore = (pageRows ?? []).length > parsed.data.pageSize;
    const chargeRows = (pageRows ?? []).slice(0, parsed.data.pageSize);

    const studentIds = Array.from(new Set((chargeRows ?? []).map((row) => row.student_id)));
    const { data: studentRows } = studentIds.length
      ? await supabase.from("students").select("id, first_name, last_name, public_code").in("id", studentIds)
      : { data: [] as { id: string; first_name: string; last_name: string; public_code: string }[] };
    const studentById = new Map((studentRows ?? []).map((row) => [row.id, row]));

    const chargeIds = (chargeRows ?? []).map((row) => row.id);
    const allocationState = await loadAllocationState(supabase, chargeIds);

    const charges: (ChargeRowDTO & { studentId: string; studentName: string; studentCode: string })[] = (chargeRows ?? []).map((row) => {
      const state = allocationState.get(row.id);
      const student = studentById.get(row.student_id);
      return {
        id: row.id, description: row.description, finalCents: row.final_cents ?? 0, paidCents: state?.paidCents ?? 0,
        dueDate: row.due_date, status: row.status, pendingPayment: state?.pendingPayment ?? null, confirmedPaymentId: state?.confirmedPaymentId ?? null,
        studentId: row.student_id, studentName: student ? `${student.last_name}, ${student.first_name}` : "", studentCode: student?.public_code ?? ""
      };
    });
    return NextResponse.json({ charges, hasMore });
  } catch { return NextResponse.json({ error: "El servicio de datos no está disponible." }, { status: 503 }); }
}
