import { NextResponse } from "next/server";
import { z } from "zod";
import { isSameOrigin } from "@/lib/http/request";
import { readSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation";
import type { CourseOption } from "@/lib/billing/types";

const querySchema = z.object({ academyId: uuidSchema });

const createSchema = z.object({
  academyId: uuidSchema,
  name: z.string().min(1).max(120),
  estimatedDurationWeeks: z.coerce.number().int().min(1).max(260).optional(),
  defaultInstallments: z.coerce.number().int().min(1).max(60).default(1),
  classDurationMinutes: z.coerce.number().int().min(1).max(600).optional(),
  suggestedCapacity: z.coerce.number().int().min(1).max(500).optional(),
  suggestedPriceCents: z.coerce.number().int().min(0).default(0),
  suggestedCommissionBps: z.coerce.number().int().min(0).max(10000).optional()
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function nextCourseCode(supabase: any, workspaceId: string, academyId: string): Promise<string> {
  const { data } = await supabase.from("courses").select("code")
    .eq("workspace_id", workspaceId).eq("academy_id", academyId).like("code", "CUR-%")
    .order("code", { ascending: false }).limit(1).maybeSingle();
  const last = data ? parseInt(String(data.code).slice(4), 10) : 0;
  return `CUR-${String((Number.isFinite(last) ? last : 0) + 1).padStart(4, "0")}`;
}

export async function GET(request: Request) {
  const user = await readSession();
  if (!user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Academia inválida" }, { status: 400 });
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("courses")
      .select("id, name, code, estimated_duration_weeks, default_installments, class_duration_minutes, suggested_capacity, suggested_price_cents, currency, suggested_commission_bps, active")
      .eq("workspace_id", user.workspaceId)
      .eq("academy_id", parsed.data.academyId)
      .eq("active", true)
      .order("name");
    if (error) return NextResponse.json({ error: "No se pudieron cargar los cursos" }, { status: 500 });
    const courses: CourseOption[] = (data ?? []).map((row) => ({
      id: row.id, name: row.name, code: row.code,
      estimatedDurationWeeks: row.estimated_duration_weeks, defaultInstallments: row.default_installments,
      classDurationMinutes: row.class_duration_minutes, suggestedCapacity: row.suggested_capacity,
      suggestedPriceCents: row.suggested_price_cents, currency: row.currency, suggestedCommissionBps: row.suggested_commission_bps,
      active: row.active
    }));
    return NextResponse.json({ courses });
  } catch { return NextResponse.json({ error: "El servicio de datos no está disponible." }, { status: 503 }); }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  const user = await readSession();
  if (!user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (user.role !== "owner") return NextResponse.json({ error: "Solo la propietaria puede crear cursos." }, { status: 403 });
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos de curso inválidos" }, { status: 400 });
  try {
    const supabase = await createSupabaseServerClient();
    const code = await nextCourseCode(supabase, user.workspaceId, parsed.data.academyId);
    const { data, error } = await supabase.from("courses").insert({
      workspace_id: user.workspaceId,
      academy_id: parsed.data.academyId,
      code,
      name: parsed.data.name,
      estimated_duration_weeks: parsed.data.estimatedDurationWeeks ?? null,
      default_installments: parsed.data.defaultInstallments,
      class_duration_minutes: parsed.data.classDurationMinutes ?? null,
      suggested_capacity: parsed.data.suggestedCapacity ?? null,
      suggested_price_cents: parsed.data.suggestedPriceCents,
      suggested_commission_bps: parsed.data.suggestedCommissionBps ?? null,
      active: true
    }).select("id, code").single();
    if (error) return NextResponse.json({ error: "No se pudo crear el curso" }, { status: 500 });
    return NextResponse.json({ id: data.id, code: data.code }, { status: 201 });
  } catch { return NextResponse.json({ error: "El servicio de datos no está disponible." }, { status: 503 }); }
}
