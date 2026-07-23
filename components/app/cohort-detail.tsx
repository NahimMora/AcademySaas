"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { formatDate } from "@/lib/domain/format";
import { formatMoney } from "@/lib/domain/money";
import { Empty, Metric, PageHeader, StatusBadge } from "@/components/app/ui";
import { NewEnrollmentModal } from "@/components/app/new-enrollment-modal";
import { useSessionUser } from "@/components/app/app-shell";
import type { CohortDetailDTO } from "@/lib/cohorts/types";

async function readError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null);
  return typeof body?.error === "string" ? body.error : fallback;
}

export function CohortDetail({ id, instructor = false }: { id: string; instructor?: boolean }) {
  const user = useSessionUser();
  const [cohort, setCohort] = useState<CohortDetailDTO | null>(null);
  const [error, setError] = useState("");
  const [enrollOpen, setEnrollOpen] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch(`/api/cohorts/${id}`);
    if (!response.ok) { setError(await readError(response, "No se pudo cargar la comisión")); return; }
    const data = await response.json() as { cohort: CohortDetailDTO };
    setCohort(data.cohort);
  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const backHref = instructor ? "/instructor/cohorts" : "/app/cohorts";
  if (error) return <><Link href={backHref} className="text-sm font-bold text-[var(--brand)]">← Volver a comisiones</Link><p className="mt-4 rounded-xl bg-red-50 text-red-800 p-3 text-sm">{error}</p></>;
  if (cohort === null) return <PageHeader eyebrow="Oferta activa" title="Comisión" description="Cargando…" />;

  return <>
    <Link href={backHref} className="text-sm font-bold text-[var(--brand)]">← Volver a comisiones</Link>
    <PageHeader
      eyebrow={cohort.code} title={cohort.name}
      description={`${cohort.courseName} · ${cohort.scheduleSummary || "Sin horario"} · ${cohort.instructorName ?? "Sin profesor asignado"}`}
      action={!instructor && user.role === "owner" && cohort.roster.length < cohort.capacity && <button onClick={() => setEnrollOpen(true)} className="btn btn-primary"><Plus size={17} /> Inscribir alumno</button>}
    />
    <div className="grid sm:grid-cols-4 gap-4">
      <Metric label="Ocupación" value={`${cohort.roster.length}/${cohort.capacity}`} note={`${cohort.capacity - cohort.roster.length} vacantes`} />
      <Metric label="Cuota" value={formatMoney(cohort.installmentCents)} note={`${cohort.installmentCount} cuotas`} />
      <Metric label="Comisión docente" value={`${((cohort.commissionBps ?? 0) / 100).toFixed(0)}%`} note="Regla vigente" tone="blue" />
      <Metric label="Fechas" value={formatDate(cohort.startDate)} note={`hasta ${formatDate(cohort.estimatedEndDate)}`} tone="gold" />
    </div>
    <section className="card table-wrap mt-5">
      <div className="p-5 border-b border-[var(--line)]"><h3 className="font-black">Nómina</h3><p className="muted text-xs mt-1">Inscripción y saldo pendiente de cada alumno</p></div>
      <table><thead><tr><th>Alumno</th><th>Código</th><th>Inscripción</th><th>Saldo</th></tr></thead>
        <tbody>{cohort.roster.map((row) => <tr key={row.enrollmentId}>
          <td><Link href={`/app/students/${row.studentId}`} className="font-bold text-[var(--brand)]">{row.studentName}</Link></td>
          <td>{row.studentCode}</td>
          <td><StatusBadge value={row.status} /></td>
          <td>{row.balanceCents > 0 ? <span className="text-amber-700 font-bold">{formatMoney(row.balanceCents)}</span> : <span className="text-emerald-700 font-bold">Al día</span>}</td>
        </tr>)}</tbody>
      </table>
      {cohort.roster.length === 0 && <Empty title="Sin alumnos inscriptos" detail="Todavía no hay inscripciones en esta comisión." />}
    </section>
    {enrollOpen && <NewEnrollmentModal academyId={cohort.academyId} onClose={() => setEnrollOpen(false)} defaultCohortId={cohort.id} onCreated={() => { setEnrollOpen(false); void load(); }} />}
  </>;
}
