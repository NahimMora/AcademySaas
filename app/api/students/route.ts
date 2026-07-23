import { NextResponse } from "next/server";
import { z } from "zod";
import { isSameOrigin } from "@/lib/http/request";
import { readSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation";
import { log } from "@/lib/observability/logger";
import { normalizeSearchText } from "@/lib/students/search";
import type { StudentListItemDTO } from "@/lib/students/types";

const listQuerySchema = z.object({
  academyId: uuidSchema,
  status: z.enum(["all", "active", "inactive", "blocked", "archived"]).default("all"),
  q: z.string().max(80).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25)
});

const guardianSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  relationship: z.string().min(1).max(60),
  phone: z.string().min(6).max(30)
});

const createSchema = z.object({
  academyId: uuidSchema,
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  dni: z.string().regex(/^[0-9]{7,9}$/, "DNI inválido"),
  birthDate: z.iso.date(),
  phone: z.string().min(6).max(30),
  email: z.email().optional(),
  guardian: guardianSchema.optional()
});

function calculateAge(birthDate: string, today = new Date()): number {
  const dob = new Date(`${birthDate}T00:00:00`);
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function nextPublicCode(supabase: any, workspaceId: string): Promise<string> {
  const { data } = await supabase.from("students").select("public_code")
    .eq("workspace_id", workspaceId).like("public_code", "ALU-%")
    .order("public_code", { ascending: false }).limit(1).maybeSingle();
  const last = data ? parseInt(String(data.public_code).slice(4), 10) : 0;
  return `ALU-${String((Number.isFinite(last) ? last : 0) + 1).padStart(4, "0")}`;
}

export async function GET(request: Request) {
  const user = await readSession();
  if (!user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const parsed = listQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  try {
    const supabase = await createSupabaseServerClient();
    let query = supabase.from("students")
      .select("id,public_code,first_name,last_name,dni_normalized,phone,email,status,created_at")
      .eq("workspace_id", user.workspaceId)
      .eq("academy_id", parsed.data.academyId);
    if (parsed.data.status !== "all") query = query.eq("status", parsed.data.status);
    if (parsed.data.q) {
      const term = parsed.data.q.replace(/[%,]/g, "").trim();
      const normalized = normalizeSearchText(term);
      if (term) query = query.or(`first_name_search.ilike.%${normalized}%,last_name_search.ilike.%${normalized}%,dni_normalized.ilike.%${term}%,public_code.ilike.%${term}%`);
    }
    const from = (parsed.data.page - 1) * parsed.data.pageSize;
    const { data: pageRows, error } = await query.order("last_name").range(from, from + parsed.data.pageSize);
    if (error) return NextResponse.json({ error: "No se pudieron cargar los alumnos" }, { status: 500 });
    const hasMore = (pageRows ?? []).length > parsed.data.pageSize;
    const data = (pageRows ?? []).slice(0, parsed.data.pageSize);

    const studentIds = (data ?? []).map((row) => row.id);
    const { data: guardianRows } = studentIds.length
      ? await supabase.from("student_guardians").select("student_id").in("student_id", studentIds)
      : { data: [] as { student_id: string }[] };
    const withGuardian = new Set((guardianRows ?? []).map((row) => row.student_id));

    const students: StudentListItemDTO[] = (data ?? []).map((row) => ({
      id: row.id,
      publicCode: row.public_code,
      firstName: row.first_name,
      lastName: row.last_name,
      dniMasked: `••.${row.dni_normalized.slice(-3)}`,
      phone: row.phone,
      email: row.email,
      status: row.status as StudentListItemDTO["status"],
      createdAt: row.created_at,
      hasGuardian: withGuardian.has(row.id)
    }));
    return NextResponse.json({ students, hasMore });
  } catch { return NextResponse.json({ error: "El servicio de datos no está disponible." }, { status: 503 }); }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  const user = await readSession();
  if (!user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos de alumno inválidos" }, { status: 400 });
  const isMinor = calculateAge(parsed.data.birthDate) < 18;
  if (isMinor && !parsed.data.guardian) return NextResponse.json({ error: "Se requieren los datos de un tutor para un alumno menor de edad." }, { status: 400 });

  try {
    const supabase = await createSupabaseServerClient();
    let student: { id: string; public_code: string } | null = null;
    let lastError: { code?: string } | null = null;
    for (let attempt = 0; attempt < 3 && !student; attempt++) {
      const publicCode = await nextPublicCode(supabase, user.workspaceId);
      const { data, error } = await supabase.from("students").insert({
        workspace_id: user.workspaceId,
        academy_id: parsed.data.academyId,
        public_code: publicCode,
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
        dni_normalized: parsed.data.dni,
        birth_date: parsed.data.birthDate,
        phone: parsed.data.phone,
        email: parsed.data.email ?? null,
        status: "active",
        created_by: user.id
      }).select("id, public_code").single();
      if (data) { student = data; break; }
      lastError = error;
      if (error?.code !== "23505") break;
    }
    if (!student) return NextResponse.json({ error: lastError?.code === "23505" ? "No se pudo generar un código único, reintentá." : "No se pudo crear el alumno." }, { status: 500 });

    if (parsed.data.guardian) {
      const { error: guardianError } = await supabase.from("student_guardians").insert({
        workspace_id: user.workspaceId,
        student_id: student.id,
        first_name: parsed.data.guardian.firstName,
        last_name: parsed.data.guardian.lastName,
        relationship: parsed.data.guardian.relationship,
        phone: parsed.data.guardian.phone,
        is_primary: true
      });
      if (guardianError) return NextResponse.json({ error: "El alumno se creó, pero no se pudo guardar el tutor. Editá el legajo para agregarlo." }, { status: 207 });
    }
    log("info", "students.created", { workspaceId: user.workspaceId, studentId: student.id });
    return NextResponse.json({ id: student.id, publicCode: student.public_code }, { status: 201 });
  } catch { return NextResponse.json({ error: "El servicio de datos no está disponible." }, { status: 503 }); }
}
