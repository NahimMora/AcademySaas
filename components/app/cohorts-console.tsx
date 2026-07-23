"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Empty, PageHeader, StatusBadge } from "@/components/app/ui";
import { NewCohortModal } from "@/components/app/new-cohort-modal";
import { usePaginatedList } from "@/components/app/hooks/use-paginated-list";
import { useSessionUser } from "@/components/app/app-shell";
import type { AcademyOption } from "@/lib/students/types";
import type { CohortOption } from "@/lib/billing/types";

async function readError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null);
  return typeof body?.error === "string" ? body.error : fallback;
}

const statusOptions = [["all", "Todas"], ["scheduled", "Programadas"], ["active", "Activas"], ["paused", "Pausadas"], ["finished", "Finalizadas"], ["cancelled", "Canceladas"]] as const;

export function CohortsConsole({ instructor = false }: { instructor?: boolean }) {
  const user = useSessionUser();
  const [academies, setAcademies] = useState<AcademyOption[] | null>(null);
  const [academyId, setAcademyId] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [newCohortOpen, setNewCohortOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const response = await fetch("/api/academies/context");
      if (!response.ok) { setError(await readError(response, "No se pudieron cargar las academias")); setAcademies([]); return; }
      const data = await response.json() as { academies: AcademyOption[] };
      setAcademies(data.academies);
      if (data.academies[0]) setAcademyId(data.academies[0].id);
    })();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const fetchCohortsPage = useCallback(async (params: { academyId: string; status: string }, page: number, pageSize: number) => {
    const query = new URLSearchParams({ academyId: params.academyId, status: params.status, page: String(page), pageSize: String(pageSize) });
    const response = await fetch(`/api/cohorts?${query.toString()}`);
    if (!response.ok) { setError(await readError(response, "No se pudieron cargar las comisiones")); return { items: [], hasMore: false }; }
    const data = await response.json() as { cohorts: CohortOption[]; hasMore: boolean };
    return { items: data.cohorts, hasMore: data.hasMore };
  }, []);

  const { items: cohorts, hasMore, loading, loadMore, reload } = usePaginatedList({
    params: academyId ? { academyId, status: statusFilter } : null,
    fetchPage: fetchCohortsPage
  });

  const filtered = (cohorts ?? []).filter((cohort) => {
    if (!debouncedSearch) return true;
    const term = debouncedSearch.toLowerCase();
    return cohort.name.toLowerCase().includes(term) || cohort.code.toLowerCase().includes(term) || (cohort.courseName ?? "").toLowerCase().includes(term);
  });

  const title = instructor ? "Mis comisiones" : "Comisiones";
  if (academies === null) return <PageHeader eyebrow="Oferta activa" title={title} description="Cargando academias…" />;
  if (academies.length === 0) return <><PageHeader eyebrow="Oferta activa" title={title} description="Ediciones concretas, cupos, horarios y reglas económicas." />{error && <p className="rounded-xl bg-red-50 text-red-800 p-3 text-sm">{error}</p>}<Empty title="Sin academias asignadas" detail="Tu usuario no tiene acceso a ninguna academia." /></>;

  return <>
    <PageHeader
      eyebrow="Oferta activa" title={title} description={instructor ? "Solo se muestran las comisiones donde sos profesor asignado." : "Ediciones concretas, cupos, horarios y reglas económicas."}
      action={<div className="flex gap-2 items-center">
        {academies.length > 1 && <select className="field" value={academyId} onChange={(e) => setAcademyId(e.target.value)}>{academies.map((academy) => <option key={academy.id} value={academy.id}>{academy.name}</option>)}</select>}
        {!instructor && user.role === "owner" && <button onClick={() => setNewCohortOpen(true)} className="btn btn-primary"><Plus size={18} /> Nueva comisión</button>}
      </div>}
    />
    {error && <p className="mb-4 rounded-xl bg-red-50 text-red-800 p-3 text-sm">{error}</p>}

    <div className="flex flex-col sm:flex-row gap-2 mb-5">
      <label className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 muted" size={18} /><input className="field pl-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, código o curso…" /></label>
      <select className="field sm:max-w-xs" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
    </div>

    {cohorts === null
      ? <p className="muted text-sm">Cargando comisiones…</p>
      : <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((cohort) => <Link key={cohort.id} href={`${instructor ? "/instructor" : "/app"}/cohorts/${cohort.id}`} className="card p-5 hover:-translate-y-0.5 transition">
          <div className="flex justify-between"><span className="badge">{cohort.code}</span><StatusBadge value={cohort.status ?? ""} /></div>
          <h3 className="text-lg font-black mt-5">{cohort.name}</h3>
          <p className="muted text-sm mt-1">{cohort.courseName}</p>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <span><small className="block muted">Profesor</small><strong>{cohort.instructorName || "Sin asignar"}</strong></span>
            <span><small className="block muted">Horario</small><strong>{cohort.scheduleSummary || "—"}</strong></span>
            <span><small className="block muted">Sede</small><strong>{cohort.branchName}</strong></span>
            <span><small className="block muted">Ocupación</small><strong>{cohort.enrolledCount} de {cohort.capacity}</strong></span>
          </div>
        </Link>)}
        {filtered.length === 0 && <Empty title="Sin comisiones" detail="No hay comisiones que coincidan con la búsqueda." />}
      </div>}
    {hasMore && <div className="flex items-center justify-between mt-4"><p className="text-xs muted">Mostrando {cohorts?.length ?? 0}</p><button onClick={() => void loadMore()} disabled={loading} className="btn btn-secondary">{loading ? "Cargando…" : "Mostrar más"}</button></div>}

    {newCohortOpen && <NewCohortModal academyId={academyId} onClose={() => setNewCohortOpen(false)} onCreated={() => { setNewCohortOpen(false); reload(); }} />}
  </>;
}
