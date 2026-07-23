"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BookOpen, Plus } from "lucide-react";
import { formatMoney } from "@/lib/domain/money";
import { Empty, PageHeader } from "@/components/app/ui";
import { NewCourseModal } from "@/components/app/new-course-modal";
import { useSessionUser } from "@/components/app/app-shell";
import type { AcademyOption } from "@/lib/students/types";
import type { CourseOption } from "@/lib/billing/types";

async function readError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null);
  return typeof body?.error === "string" ? body.error : fallback;
}

export function CoursesConsole() {
  const user = useSessionUser();
  const [academies, setAcademies] = useState<AcademyOption[] | null>(null);
  const [academyId, setAcademyId] = useState("");
  const [courses, setCourses] = useState<CourseOption[] | null>(null);
  const [error, setError] = useState("");
  const [newCourseOpen, setNewCourseOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const response = await fetch("/api/academies/context");
      if (!response.ok) { setError(await readError(response, "No se pudieron cargar las academias")); setAcademies([]); return; }
      const data = await response.json() as { academies: AcademyOption[] };
      setAcademies(data.academies);
      if (data.academies[0]) setAcademyId(data.academies[0].id);
    })();
  }, []);

  const loadCourses = useCallback(async (id: string) => {
    if (!id) return;
    const response = await fetch(`/api/courses?academyId=${id}`);
    if (!response.ok) { setError(await readError(response, "No se pudieron cargar los cursos")); return; }
    const data = await response.json() as { courses: CourseOption[] };
    setCourses(data.courses);
  }, []);

  useEffect(() => {
    if (!academyId) return;
    const timer = window.setTimeout(() => void loadCourses(academyId), 0);
    return () => window.clearTimeout(timer);
  }, [academyId, loadCourses]);

  if (academies === null) return <PageHeader eyebrow="Catálogo" title="Cursos" description="Cargando academias…" />;
  if (academies.length === 0) return <><PageHeader eyebrow="Catálogo" title="Cursos" description="Duración, precio y cuotas sugeridas por curso." />{error && <p className="rounded-xl bg-red-50 text-red-800 p-3 text-sm">{error}</p>}<Empty title="Sin academias asignadas" detail="Tu usuario no tiene acceso a ninguna academia." /></>;

  return <>
    <PageHeader
      eyebrow="Catálogo" title="Cursos" description="Tocá un curso para ver sus comisiones y agregar una nueva."
      action={<div className="flex gap-2 items-center">
        {academies.length > 1 && <select className="field" value={academyId} onChange={(e) => setAcademyId(e.target.value)}>{academies.map((academy) => <option key={academy.id} value={academy.id}>{academy.name}</option>)}</select>}
        {user.role === "owner" && <button onClick={() => setNewCourseOpen(true)} className="btn btn-primary"><Plus size={18} /> Nuevo curso</button>}
      </div>}
    />
    {error && <p className="mb-4 rounded-xl bg-red-50 text-red-800 p-3 text-sm">{error}</p>}

    {courses === null
      ? <p className="muted text-sm">Cargando cursos…</p>
      : <div className="grid md:grid-cols-3 gap-4">
        {courses.map((course) => <Link href={`/app/courses/${course.id}`} key={course.id} className="card p-5 hover:-translate-y-0.5 transition">
          <span className="grid place-items-center size-11 rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]"><BookOpen /></span>
          <h3 className="font-black mt-4">{course.name}</h3>
          <p className="muted text-sm mt-1">Código {course.code}{course.estimatedDurationWeeks ? ` · ${course.estimatedDurationWeeks} semanas` : ""}</p>
          <div className="flex justify-between border-t border-[var(--line)] mt-5 pt-4 text-sm">
            <span>{course.defaultInstallments} cuotas</span>
            <strong>{formatMoney(course.suggestedPriceCents ?? 0)}</strong>
          </div>
        </Link>)}
        {courses.length === 0 && <Empty title="Sin cursos todavía" detail="Creá el primer curso con el botón de arriba." />}
      </div>}

    <NewCourseModal open={newCourseOpen} onClose={() => setNewCourseOpen(false)} academyId={academyId} onCreated={() => void loadCourses(academyId)} />
  </>;
}
