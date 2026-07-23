"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Empty, PageHeader } from "@/components/app/ui";
import type { AcademyOption } from "@/lib/students/types";
import type { TeacherListItemDTO } from "@/lib/teachers/types";

async function readError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null);
  return typeof body?.error === "string" ? body.error : fallback;
}

function initials(name: string) { return name.split(" ").map((part) => part[0]).slice(0, 2).join(""); }

export function TeachersConsole() {
  const [academies, setAcademies] = useState<AcademyOption[] | null>(null);
  const [academyId, setAcademyId] = useState("");
  const [teachers, setTeachers] = useState<TeacherListItemDTO[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const response = await fetch("/api/academies/context");
      if (!response.ok) { setError(await readError(response, "No se pudieron cargar las academias")); setAcademies([]); return; }
      const data = await response.json() as { academies: AcademyOption[] };
      setAcademies(data.academies);
      if (data.academies[0]) setAcademyId(data.academies[0].id);
    })();
  }, []);

  const loadTeachers = useCallback(async (id: string) => {
    if (!id) return;
    const response = await fetch(`/api/teachers?academyId=${id}`);
    if (!response.ok) { setError(await readError(response, "No se pudieron cargar los profesores")); return; }
    const data = await response.json() as { teachers: TeacherListItemDTO[] };
    setTeachers(data.teachers);
  }, []);

  useEffect(() => {
    if (!academyId) return;
    const timer = window.setTimeout(() => void loadTeachers(academyId), 0);
    return () => window.clearTimeout(timer);
  }, [academyId, loadTeachers]);

  if (academies === null) return <PageHeader eyebrow="Cuerpo docente" title="Profesores" description="Cargando academias…" />;
  if (academies.length === 0) return <><PageHeader eyebrow="Cuerpo docente" title="Profesores" description="Cada profesor agrupa sus comisiones y alumnos en un solo lugar." />{error && <p className="rounded-xl bg-red-50 text-red-800 p-3 text-sm">{error}</p>}<Empty title="Sin academias asignadas" detail="Tu usuario no tiene acceso a ninguna academia." /></>;

  return <>
    <PageHeader
      eyebrow="Cuerpo docente" title="Profesores" description="Cada profesor agrupa sus comisiones y alumnos en un solo lugar."
      action={academies.length > 1 && <select className="field" value={academyId} onChange={(e) => setAcademyId(e.target.value)}>{academies.map((academy) => <option key={academy.id} value={academy.id}>{academy.name}</option>)}</select>}
    />
    {error && <p className="mb-4 rounded-xl bg-red-50 text-red-800 p-3 text-sm">{error}</p>}
    {teachers === null
      ? <p className="muted text-sm">Cargando profesores…</p>
      : <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {teachers.map((teacher) => <Link key={teacher.userId} href={`/app/teachers/${teacher.userId}`} className="card p-5 hover:-translate-y-0.5 transition">
          <div className="flex items-center gap-3">
            <span className="grid place-items-center size-11 shrink-0 rounded-xl bg-[var(--brand-soft)] text-[var(--brand)] font-black text-xs">{initials(teacher.fullName)}</span>
            <div className="min-w-0"><h3 className="font-black truncate">{teacher.fullName}</h3></div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm"><span><small className="block muted">Comisiones</small><strong>{teacher.cohortCount}</strong></span><span><small className="block muted">Alumnos</small><strong>{teacher.enrolledCount} de {teacher.capacity}</strong></span></div>
          <div className="mt-4 flex items-center gap-1 text-xs font-bold text-[var(--brand)]">Ver detalle <ChevronRight size={14} /></div>
        </Link>)}
        {teachers.length === 0 && <Empty title="Sin profesores todavía" detail="Asigná un profesor a una comisión para que aparezca acá." />}
      </div>}
  </>;
}
