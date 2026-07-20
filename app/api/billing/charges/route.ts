import { NextResponse } from "next/server";
import { z } from "zod";
import { readSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation";
import { loadAllocationState } from "@/lib/billing/allocations";
import type { ChargeRowDTO } from "@/lib/students/types";

const querySchema = z.object({ academyId: uuidSchema });

export async function GET(request: Request) {
  const user = await readSession();
  if (!user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Academia inválida" }, { status: 400 });
  try {
    const supabase = await createSupabaseServerClient();
    const { data: chargeRows, error } = await supabase.from("charges")
      .select("id,description,final_cents,due_date,status,student_id")
      .eq("workspace_id", user.workspaceId)
      .eq("academy_id", parsed.data.academyId)
      .order("due_date")
      .limit(200);
    if (error) return NextResponse.json({ error: "No se pudieron cargar las cuotas" }, { status: 500 });

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
    return NextResponse.json({ charges });
  } catch { return NextResponse.json({ error: "El servicio de datos no está disponible." }, { status: 503 }); }
}
