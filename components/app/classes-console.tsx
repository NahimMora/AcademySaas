"use client";

import { useCallback, useEffect, useState } from "react";
import { businessToday, formatShortDate } from "@/lib/domain/format";
import { Empty, PageHeader, StatusBadge } from "@/components/app/ui";
import { AttendanceModal } from "@/components/app/attendance-modal";
import { usePaginatedList } from "@/components/app/hooks/use-paginated-list";
import { useSessionUser } from "@/components/app/app-shell";
import type { AcademyOption } from "@/lib/students/types";
import type { CohortOption } from "@/lib/billing/types";
import type { ClassListItemDTO } from "@/lib/classes/types";

async function readError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null);
  return typeof body?.error === "string" ? body.error : fallback;
}

const timeFilters = [["upcoming", "Próximas"], ["past", "Pasadas"], ["all", "Todas"]] as const;
type TimeFilter = (typeof timeFilters)[number][0];

export function ClassesConsole({ instructor = false }: { instructor?: boolean }) {
  const user = useSessionUser();
  const readOnly = !instructor && user.role === "owner";
  const [academies, setAcademies] = useState<AcademyOption[] | null>(null);
  const [academyId, setAcademyId] = useState("");
  const [cohortOptions, setCohortOptions] = useState<CohortOption[]>([]);
  const [cohortFilter, setCohortFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("upcoming");
  const [error, setError] = useState("");
  const [attendanceClassId, setAttendanceClassId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (instructor) { setAcademies([]); return; }
      (async () => {
        const response = await fetch("/api/academies/context");
        if (!response.ok) { setError(await readError(response, "No se pudieron cargar las academias")); setAcademies([]); return; }
        const data = await response.json() as { academies: AcademyOption[] };
        setAcademies(data.academies);
        if (data.academies[0]) setAcademyId(data.academies[0].id);
      })();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [instructor]);

  useEffect(() => {
    if (!academyId) return;
    (async () => {
      const response = await fetch(`/api/cohorts?academyId=${academyId}&status=all`);
      if (response.ok) setCohortOptions((await response.json()).cohorts);
    })();
  }, [academyId]);

  const fetchClassesPage = useCallback(async (params: { academyId?: string; cohortId: string; timeFilter: TimeFilter }, page: number, pageSize: number) => {
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (params.academyId) query.set("academyId", params.academyId);
    if (params.cohortId !== "all") query.set("cohortId", params.cohortId);
    const today = businessToday();
    if (params.timeFilter === "upcoming") { query.set("dateFrom", today); query.set("sort", "asc"); }
    else if (params.timeFilter === "past") {
      const yesterday = new Date(`${today}T00:00:00Z`); yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      query.set("dateTo", yesterday.toISOString().slice(0, 10)); query.set("sort", "desc");
    }
    const response = await fetch(`/api/classes?${query.toString()}`);
    if (!response.ok) { setError(await readError(response, "No se pudieron cargar las clases")); return { items: [], hasMore: false }; }
    const data = await response.json() as { classes: ClassListItemDTO[]; hasMore: boolean };
    return { items: data.classes, hasMore: data.hasMore };
  }, []);

  const { items: classes, hasMore, loading, loadMore } = usePaginatedList({
    params: instructor ? { cohortId: "all", timeFilter } : (academyId ? { academyId, cohortId: cohortFilter, timeFilter } : null),
    fetchPage: fetchClassesPage
  });

  if (!instructor && academies === null) return <PageHeader eyebrow="Calendario" title="Clases" description="Cargando academias…" />;
  if (!instructor && academies !== null && academies.length === 0) return <><PageHeader eyebrow="Calendario" title="Clases" description="Tocá una clase para ver o tomar su asistencia." />{error && <p className="rounded-xl bg-red-50 text-red-800 p-3 text-sm">{error}</p>}<Empty title="Sin academias asignadas" detail="Tu usuario no tiene acceso a ninguna academia." /></>;

  return <>
    <PageHeader
      eyebrow="Calendario" title={instructor ? "Mis clases" : "Clases"} description="Tocá una clase para ver o tomar su asistencia."
      action={!instructor && academies && academies.length > 1 && <select className="field" value={academyId} onChange={(e) => setAcademyId(e.target.value)}>{academies.map((academy) => <option key={academy.id} value={academy.id}>{academy.name}</option>)}</select>}
    />
    {error && <p className="mb-4 rounded-xl bg-red-50 text-red-800 p-3 text-sm">{error}</p>}
    <div className="flex flex-col sm:flex-row gap-2 mb-4 sm:items-end">
      {!instructor && <label className="label max-w-sm flex-1">Filtrar por comisión<select className="field" value={cohortFilter} onChange={(e) => setCohortFilter(e.target.value)}><option value="all">Todas las comisiones</option>{cohortOptions.map((cohort) => <option key={cohort.id} value={cohort.id}>{cohort.name} · {cohort.code}</option>)}</select></label>}
      <div className="flex gap-2">{timeFilters.map(([value, label]) => <button key={value} onClick={() => setTimeFilter(value)} className={`btn ${timeFilter === value ? "btn-primary" : "btn-secondary"}`}>{label}</button>)}</div>
    </div>

    {classes === null
      ? <p className="muted text-sm">Cargando clases…</p>
      : <section className="card table-wrap">
        <table><thead><tr><th>Fecha</th><th>Horario</th><th>Comisión</th><th>Profesor</th><th>Asistencia</th><th>Estado</th></tr></thead>
          <tbody>{classes.map((row) => <tr key={row.id} onClick={() => setAttendanceClassId(row.id)} className="cursor-pointer hover:bg-slate-50">
            <td><strong>{formatShortDate(`${row.sessionDate}T12:00:00Z`)}</strong></td>
            <td>{row.startsAt} — {row.endsAt}</td>
            <td>{row.cohortName}<small className="block muted">{row.cohortCode}</small></td>
            <td>{row.instructorName ?? "—"}</td>
            <td><StatusBadge value={row.attendanceClosed ? "closed" : "open"} /></td>
            <td><StatusBadge value={row.status} /></td>
          </tr>)}</tbody>
        </table>
        {classes.length === 0 && <Empty title="Sin clases" detail="No hay clases para este filtro todavía." />}
      </section>}
    {hasMore && <div className="flex items-center justify-between mt-4"><p className="text-xs muted">Mostrando {classes?.length ?? 0}</p><button onClick={() => void loadMore()} disabled={loading} className="btn btn-secondary">{loading ? "Cargando…" : "Mostrar más"}</button></div>}

    {attendanceClassId && <AttendanceModal classId={attendanceClassId} onClose={() => setAttendanceClassId(null)} onChanged={() => void 0} readOnly={readOnly} />}
  </>;
}
