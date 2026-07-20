import { NextResponse } from "next/server";
import { z } from "zod";
import { isSameOrigin } from "@/lib/http/request";
import { readSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation";
import { loadAllocationState } from "@/lib/billing/allocations";
import type { ChargeRowDTO, PaymentRowDTO, StudentDetailDTO } from "@/lib/students/types";

const guardianSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  relationship: z.string().min(1).max(60),
  phone: z.string().min(6).max(30)
});

const patchSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  dni: z.string().regex(/^[0-9]{7,9}$/, "DNI inválido"),
  birthDate: z.iso.date(),
  phone: z.string().min(6).max(30),
  email: z.email().optional(),
  status: z.enum(["active", "inactive", "blocked", "archived"]),
  guardian: guardianSchema.optional()
});

function calculateAge(birthDate: string, today = new Date()): number {
  const dob = new Date(`${birthDate}T00:00:00`);
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await readSession();
  if (!user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) return NextResponse.json({ error: "Alumno inválido" }, { status: 400 });

  try {
    const supabase = await createSupabaseServerClient();
    const { data: studentRow } = await supabase.from("students")
      .select("id,academy_id,public_code,first_name,last_name,dni_normalized,birth_date,phone,email,status,created_at")
      .eq("id", id).eq("workspace_id", user.workspaceId).maybeSingle();
    if (!studentRow) return NextResponse.json({ error: "Alumno no encontrado" }, { status: 404 });

    const { data: guardianRow } = await supabase.from("student_guardians")
      .select("id,first_name,last_name,relationship,phone,email,is_primary")
      .eq("student_id", id).order("is_primary", { ascending: false }).limit(1).maybeSingle();

    const { data: enrollmentRow } = await supabase.from("enrollments")
      .select("id,status,installment_count,cohort_id")
      .eq("student_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    let cohortInfo: { name: string; code: string; courseName: string } | null = null;
    if (enrollmentRow) {
      const { data: cohortRow } = await supabase.from("cohorts").select("name,code,course_id").eq("id", enrollmentRow.cohort_id).maybeSingle();
      const { data: courseRow } = cohortRow ? await supabase.from("courses").select("name").eq("id", cohortRow.course_id).maybeSingle() : { data: null };
      if (cohortRow) cohortInfo = { name: cohortRow.name, code: cohortRow.code, courseName: courseRow?.name ?? "" };
    }

    const { data: chargeRows } = await supabase.from("charges")
      .select("id,description,final_cents,due_date,status")
      .eq("student_id", id).order("due_date");
    const chargeIds = (chargeRows ?? []).map((row) => row.id);
    const allocationState = await loadAllocationState(supabase, chargeIds);
    const charges: ChargeRowDTO[] = (chargeRows ?? []).map((row) => {
      const state = allocationState.get(row.id);
      return {
        id: row.id,
        description: row.description,
        finalCents: row.final_cents ?? 0,
        paidCents: state?.paidCents ?? 0,
        dueDate: row.due_date,
        status: row.status,
        pendingPayment: state?.pendingPayment ?? null,
        confirmedPaymentId: state?.confirmedPaymentId ?? null
      };
    });

    const { data: paymentRows } = await supabase.from("payments")
      .select("id,reference,amount_cents,method,status,registered_at")
      .eq("student_id", id).order("registered_at", { ascending: false });
    const payments: PaymentRowDTO[] = (paymentRows ?? []).map((row) => ({
      id: row.id, reference: row.reference, amountCents: row.amount_cents, method: row.method, status: row.status, registeredAt: row.registered_at
    }));

    const student: StudentDetailDTO = {
      id: studentRow.id, academyId: studentRow.academy_id, publicCode: studentRow.public_code, firstName: studentRow.first_name, lastName: studentRow.last_name,
      dni: studentRow.dni_normalized, birthDate: studentRow.birth_date, phone: studentRow.phone, email: studentRow.email,
      status: studentRow.status, createdAt: studentRow.created_at,
      guardian: guardianRow ? { id: guardianRow.id, firstName: guardianRow.first_name, lastName: guardianRow.last_name, relationship: guardianRow.relationship, phone: guardianRow.phone, email: guardianRow.email } : null,
      enrollment: enrollmentRow ? { id: enrollmentRow.id, status: enrollmentRow.status, installmentCount: enrollmentRow.installment_count, cohortName: cohortInfo?.name ?? "", cohortCode: cohortInfo?.code ?? "", courseName: cohortInfo?.courseName ?? "" } : null
    };
    return NextResponse.json({ student, charges, payments });
  } catch { return NextResponse.json({ error: "El servicio de datos no está disponible." }, { status: 503 }); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  const user = await readSession();
  if (!user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) return NextResponse.json({ error: "Alumno inválido" }, { status: 400 });
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos de alumno inválidos" }, { status: 400 });
  const isMinor = calculateAge(parsed.data.birthDate) < 18;
  if (isMinor && !parsed.data.guardian) return NextResponse.json({ error: "Se requieren los datos de un tutor para un alumno menor de edad." }, { status: 400 });

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("students").update({
      first_name: parsed.data.firstName, last_name: parsed.data.lastName, dni_normalized: parsed.data.dni,
      birth_date: parsed.data.birthDate, phone: parsed.data.phone, email: parsed.data.email ?? null,
      status: parsed.data.status, updated_by: user.id
    }).eq("id", id).eq("workspace_id", user.workspaceId);
    if (error) return NextResponse.json({ error: "No se pudo actualizar el legajo" }, { status: 500 });

    if (parsed.data.guardian) {
      const { data: existing } = await supabase.from("student_guardians").select("id").eq("student_id", id).eq("is_primary", true).maybeSingle();
      if (existing) {
        await supabase.from("student_guardians").update({
          first_name: parsed.data.guardian.firstName, last_name: parsed.data.guardian.lastName,
          relationship: parsed.data.guardian.relationship, phone: parsed.data.guardian.phone
        }).eq("id", existing.id);
      } else {
        await supabase.from("student_guardians").insert({
          workspace_id: user.workspaceId, student_id: id, first_name: parsed.data.guardian.firstName, last_name: parsed.data.guardian.lastName,
          relationship: parsed.data.guardian.relationship, phone: parsed.data.guardian.phone, is_primary: true
        });
      }
    }
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "El servicio de datos no está disponible." }, { status: 503 }); }
}
