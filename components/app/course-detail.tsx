"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { formatDate } from "@/lib/domain/format";
import { Empty, Metric, PageHeader, StatusBadge } from "@/components/app/ui";
import { NewCohortModal } from "@/components/app/new-cohort-modal";
import { useSessionUser } from "@/components/app/app-shell";
import type { CourseDetailDTO } from "@/lib/courses/types";

async function readError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null);
  return typeof body?.error === "string" ? body.error : fallback;
}

export function CourseDetail({ id }: { id: string }) {
  const user = useSessionUser();
  const [course, setCourse] = useState<CourseDetailDTO | null>(null);
  const [error, setError] = useState("");
  const [newCohortOpen, setNewCohortOpen] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch(`/api/courses/${id}`);
    if (!response.ok) { setError(await readError(response, "No se pudo cargar el curso")); return; }
    const data = await response.json() as { course: CourseDetailDTO };
    setCourse(data.course);
  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  if (error) return <><Link href="/app/courses" className="text-sm font-bold text-[var(--brand)]">← Volver a cursos</Link><p className="mt-4 rounded-xl bg-red-50 text-red-800 p-3 text-sm">{error}</p></>;
  if (course === null) return <PageHeader eyebrow="Catálogo" title="Curso" description="Cargando…" />;

  const totalEnrolled = course.cohorts.reduce((sum, cohort) => sum + cohort.enrolledCount, 0);
  const totalCapacity = course.cohorts.reduce((sum, cohort) => sum + cohort.capacity, 0);

  return <>
    <Link href="/app/courses" className="text-sm font-bold text-[var(--brand)]">← Volver a cursos</Link>
    <PageHeader
      eyebrow={`Código ${course.code}`} title={course.name}
      description={`${course.estimatedDurationWeeks ? `${course.estimatedDurationWeeks} semanas · ` : ""}comisiones concretas de este curso`}
      action={user.role === "owner" && <button onClick={() => setNewCohortOpen(true)} className="btn btn-primary"><Plus size={17} /> Nueva comisión</button>}
    />
    <div className="grid sm:grid-cols-3 gap-4 mb-5">
      <Metric label="Comisiones" value={String(course.cohorts.length)} note="Todas las sedes" />
      <Metric label="Alumnos en nómina" value={String(totalEnrolled)} note={`${totalCapacity - totalEnrolled} vacantes totales`} tone="blue" />
      <Metric label="Ocupación" value={`${totalCapacity ? Math.round((totalEnrolled / totalCapacity) * 100) : 0}%`} note="Promedio de sus comisiones" tone="gold" />
    </div>
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
      {course.cohorts.map((cohort) => <Link key={cohort.id} href={`/app/cohorts/${cohort.id}`} className="card p-5 hover:-translate-y-0.5 transition">
        <div className="flex justify-between"><span className="badge">{cohort.code}</span><StatusBadge value={cohort.status} /></div>
        <h3 className="text-lg font-black mt-5">{cohort.name}</h3>
        <p className="muted text-sm mt-1">{formatDate(cohort.startDate)} — {formatDate(cohort.estimatedEndDate)}</p>
        <div className="mt-5 grid grid-cols-2 gap-3 text-sm"><span><small className="block muted">Ocupación</small><strong>{cohort.enrolledCount} de {cohort.capacity}</strong></span></div>
      </Link>)}
      {course.cohorts.length === 0 && <Empty title="Sin comisiones todavía" detail="Creá la primera comisión de este curso con el botón de arriba." />}
    </div>
    {newCohortOpen && <NewCohortModal onClose={() => setNewCohortOpen(false)} defaultCourseId={course.id} onCreated={() => { setNewCohortOpen(false); void load(); }} />}
  </>;
}
