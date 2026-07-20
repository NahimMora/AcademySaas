import { NextResponse } from "next/server";
import { z } from "zod";
import { readSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation";
import type { PaymentRowDTO } from "@/lib/students/types";

const querySchema = z.object({ academyId: uuidSchema });

export async function GET(request: Request) {
  const user = await readSession();
  if (!user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Academia inválida" }, { status: 400 });
  try {
    const supabase = await createSupabaseServerClient();
    const { data: paymentRows, error } = await supabase.from("payments")
      .select("id,reference,amount_cents,method,status,registered_at,student_id")
      .eq("workspace_id", user.workspaceId)
      .eq("academy_id", parsed.data.academyId)
      .order("registered_at", { ascending: false })
      .limit(200);
    if (error) return NextResponse.json({ error: "No se pudieron cargar los pagos" }, { status: 500 });

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
    return NextResponse.json({ payments });
  } catch { return NextResponse.json({ error: "El servicio de datos no está disponible." }, { status: 503 }); }
}
