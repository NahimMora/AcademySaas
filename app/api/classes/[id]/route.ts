import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation";
import type { ClassDetailDTO } from "@/lib/classes/types";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await readSession();
  if (!user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) return NextResponse.json({ error: "Clase inválida" }, { status: 400 });
  try {
    const supabase = await createSupabaseServerClient();
    const { data: classRow } = await supabase.from("class_sessions")
      .select("id, cohort_id, session_date, starts_at, ends_at, status, attendance_closed_at, planned_instructor_id")
      .eq("id", id).eq("workspace_id", user.workspaceId).maybeSingle();
    if (!classRow) return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 });

    const { data: cohortRow } = await supabase.from("cohorts").select("name, code, instructor_user_id").eq("id", classRow.cohort_id).maybeSingle();
    if (user.role === "instructor" && cohortRow?.instructor_user_id !== user.id) {
      return NextResponse.json({ error: "No tenés acceso a esta clase" }, { status: 403 });
    }
    const instructorName = classRow.planned_instructor_id
      ? (await supabase.from("profiles").select("full_name").eq("id", classRow.planned_instructor_id).maybeSingle()).data?.full_name ?? null
      : null;

    const { data: enrollmentRows } = await supabase.from("enrollments")
      .select("id, student_id")
      .eq("cohort_id", classRow.cohort_id).in("status", ["confirmed", "attending", "overdue"]);
    const studentIds = (enrollmentRows ?? []).map((row) => row.student_id);
    const { data: studentRows } = studentIds.length
      ? await supabase.from("students").select("id, first_name, last_name, public_code").in("id", studentIds)
      : { data: [] as { id: string; first_name: string; last_name: string; public_code: string }[] };
    const studentById = new Map((studentRows ?? []).map((row) => [row.id, row]));

    const enrollmentIds = (enrollmentRows ?? []).map((row) => row.id);
    const { data: attendanceRows } = enrollmentIds.length
      ? await supabase.from("attendance_records").select("enrollment_id, status").eq("class_session_id", id).in("enrollment_id", enrollmentIds)
      : { data: [] as { enrollment_id: string; status: string }[] };
    const statusByEnrollment = new Map((attendanceRows ?? []).map((row) => [row.enrollment_id, row.status]));

    const classDetail: ClassDetailDTO = {
      id: classRow.id, cohortId: classRow.cohort_id, cohortName: cohortRow?.name ?? "", cohortCode: cohortRow?.code ?? "",
      sessionDate: classRow.session_date, startsAt: classRow.starts_at.slice(0, 5), endsAt: classRow.ends_at.slice(0, 5), status: classRow.status,
      instructorName, attendanceClosed: Boolean(classRow.attendance_closed_at),
      roster: (enrollmentRows ?? []).map((row) => {
        const student = studentById.get(row.student_id);
        return {
          enrollmentId: row.id, studentId: row.student_id,
          studentName: student ? `${student.last_name}, ${student.first_name}` : "", studentCode: student?.public_code ?? "",
          status: statusByEnrollment.get(row.id) ?? null
        };
      })
    };
    return NextResponse.json({ class: classDetail });
  } catch { return NextResponse.json({ error: "El servicio de datos no está disponible." }, { status: 503 }); }
}
