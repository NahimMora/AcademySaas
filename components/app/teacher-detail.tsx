"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Metric, PageHeader, StatusBadge, Empty } from "@/components/app/ui";
import type { TeacherDetailDTO } from "@/lib/teachers/types";

async function readError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null);
  return typeof body?.error === "string" ? body.error : fallback;
}

function initials(name: string) { return name.split(" ").map((part) => part[0]).slice(0, 2).join(""); }

export function TeacherDetail({ userId, instructor = false }: { userId: string; instructor?: boolean }) {
  const [teacher, setTeacher] = useState<TeacherDetailDTO | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const response = await fetch(`/api/teachers/${userId}`);
      if (!response.ok) { setError(await readError(response, "No se pudo cargar el profesor")); return; }
      const data = await response.json() as { teacher: TeacherDetailDTO };
      setTeacher(data.teacher);
    })();
  }, [userId]);

  const backHref = instructor ? "/instructor/dashboard" : "/app/teachers";
  if (error) return <><Link href={backHref} className="text-sm font-bold text-[var(--brand)]">← Volver</Link><p className="mt-4 rounded-xl bg-red-50 text-red-800 p-3 text-sm">{error}</p></>;
  if (teacher === null) return <PageHeader eyebrow="Cuerpo docente" title="Profesor" description="Cargando…" />;

  const enrolled = teacher.cohorts.reduce((sum, cohort) => sum + cohort.enrolledCount, 0);
  const capacity = teacher.cohorts.reduce((sum, cohort) => sum + cohort.capacity, 0);

  return <>
    {!instructor && <Link href={backHref} className="text-sm font-bold text-[var(--brand)]">← Volver a profesores</Link>}
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-5 mb-6">
      <span className="grid place-items-center size-20 shrink-0 rounded-3xl bg-[var(--brand-soft)] text-[var(--brand)] text-2xl font-black">{initials(teacher.fullName)}</span>
      <div><h2 className="text-3xl font-black">{teacher.fullName}</h2><p className="muted text-sm">{teacher.cohorts.length} comisiones · {enrolled} alumnos en nómina</p></div>
    </div>
    <div className="grid sm:grid-cols-3 gap-4 mb-5">
      <Metric label="Comisiones" value={String(teacher.cohorts.length)} note="Todas las sedes" />
      <Metric label="Alumnos en nómina" value={String(enrolled)} note={`${capacity - enrolled} vacantes totales`} tone="blue" />
      <Metric label="Ocupación" value={`${capacity ? Math.round((enrolled / capacity) * 100) : 0}%`} note="Promedio de sus comisiones" tone="gold" />
    </div>
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
      {teacher.cohorts.map((cohort) => <Link key={cohort.id} href={`/app/cohorts/${cohort.id}`} className="card p-5 hover:-translate-y-0.5 transition">
        <div className="flex justify-between"><span className="badge">{cohort.code}</span><StatusBadge value={cohort.status} /></div>
        <h3 className="text-lg font-black mt-5">{cohort.name}</h3>
        <p className="muted text-sm mt-1">{cohort.courseName}</p>
        <div className="mt-5 grid grid-cols-2 gap-3 text-sm"><span><small className="block muted">Horario</small><strong>{cohort.scheduleSummary || "—"}</strong></span><span><small className="block muted">Ocupación</small><strong>{cohort.enrolledCount} de {cohort.capacity}</strong></span></div>
      </Link>)}
      {teacher.cohorts.length === 0 && <Empty title="Sin comisiones" detail="Este profesor todavía no tiene comisiones asignadas." />}
    </div>
  </>;
}
