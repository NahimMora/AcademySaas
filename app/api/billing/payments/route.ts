import { NextResponse } from "next/server";
import { z } from "zod";
import { readSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation";
import { resolveMatchingStudentIds } from "@/lib/students/search";
import type { PaymentRowDTO } from "@/lib/students/types";

const querySchema = z.object({
  academyId: uuidSchema,
  status: z.enum(["all", "pending_validation", "confirmed", "rejected", "reversed", "refunded"]).default("all"),
  q: z.string().max(80).optional(),
  unassigned: z.coerce.boolean().default(false),
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
    if (matchingStudentIds?.length === 0) return NextResponse.json({ payments: [], hasMore: false });

    // Anti-join: "sin asignar" = pagos sin fila en payment_allocations (left join + filtro por null).
    let query = parsed.data.unassigned
      ? supabase.from("payments").select("id,reference,amount_cents,method,status,registered_at,student_id,payment_allocations!left(payment_id)").is("payment_allocations.payment_id", null)
      : supabase.from("payments").select("id,reference,amount_cents,method,status,registered_at,student_id");
    query = query.eq("workspace_id", user.workspaceId).eq("academy_id", parsed.data.academyId);
    if (parsed.data.status !== "all") query = query.eq("status", parsed.data.status);
    if (matchingStudentIds) query = query.in("student_id", matchingStudentIds);

    const from = (parsed.data.page - 1) * parsed.data.pageSize;
    const { data: pageRows, error } = await query.order("registered_at", { ascending: false }).range(from, from + parsed.data.pageSize);
    if (error) return NextResponse.json({ error: "No se pudieron cargar los pagos" }, { status: 500 });
    const hasMore = (pageRows ?? []).length > parsed.data.pageSize;
    const paymentRows = (pageRows ?? []).slice(0, parsed.data.pageSize);

    const studentIds = Array.from(new Set((paymentRows ?? []).map((row) => row.student_id)));
    const { data: studentRows } = studentIds.length
      ? await supabase.from("students").select("id, first_name, last_name, public_code").in("id", studentIds)
      : { data: [] as { id: string; first_name: string; last_name: string; public_code: string }[] };
    const studentById = new Map((studentRows ?? []).map((row) => [row.id, row]));

    const paymentIds = (paymentRows ?? []).map((row) => row.id);
    const { data: allocationRows } = paymentIds.length
      ? await supabase.from("payment_allocations").select("payment_id, charge_id").in("payment_id", paymentIds)
      : { data: [] as { payment_id: string; charge_id: string }[] };
    const allocatedChargeByPayment = new Map((allocationRows ?? []).map((row) => [row.payment_id, row.charge_id]));

    const payments: (PaymentRowDTO & { studentId: string; studentName: string; studentCode: string; allocatedChargeId: string | null })[] = (paymentRows ?? []).map((row) => {
      const student = studentById.get(row.student_id);
      return {
        id: row.id, reference: row.reference, amountCents: row.amount_cents, method: row.method, status: row.status, registeredAt: row.registered_at,
        studentId: row.student_id, studentName: student ? `${student.last_name}, ${student.first_name}` : "", studentCode: student?.public_code ?? "",
        allocatedChargeId: allocatedChargeByPayment.get(row.id) ?? null
      };
    });
    return NextResponse.json({ payments, hasMore });
  } catch { return NextResponse.json({ error: "El servicio de datos no está disponible." }, { status: 503 }); }
}
