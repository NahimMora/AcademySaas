"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatDate } from "@/lib/domain/format";
import { formatMoney } from "@/lib/domain/money";
import { Empty, Metric, StatusBadge } from "@/components/app/ui";
import { usePaginatedList } from "@/components/app/hooks/use-paginated-list";
import type { ChargeRowDTO } from "@/lib/students/types";

type BillingCharge = ChargeRowDTO & { studentId: string; studentName: string; studentCode: string };
type BucketSummary = { count: number; cents: number };
type VencimientosSummary = { overdue: BucketSummary; next7Days: BucketSummary; next2Weeks: BucketSummary; later: BucketSummary };

const buckets = [
  ["overdue", "Vencidos", "red"],
  ["next7Days", "Próximos 7 días", "gold"],
  ["next2Weeks", "Próximas 2 semanas", "blue"],
  ["later", "Más adelante", "green"]
] as const;

async function readError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null);
  return typeof body?.error === "string" ? body.error : fallback;
}

function BucketRows({ academyId, bucket }: { academyId: string; bucket: string }) {
  const [error, setError] = useState("");
  const fetchPage = useCallback(async (params: { academyId: string; bucket: string }, page: number, pageSize: number) => {
    const query = new URLSearchParams({ academyId: params.academyId, dueBucket: params.bucket, page: String(page), pageSize: String(pageSize) });
    const response = await fetch(`/api/billing/charges?${query.toString()}`);
    if (!response.ok) { setError(await readError(response, "No se pudieron cargar las cuotas")); return { items: [], hasMore: false }; }
    const data = await response.json() as { charges: BillingCharge[]; hasMore: boolean };
    return { items: data.charges, hasMore: data.hasMore };
  }, []);
  const { items: charges, hasMore, loading, loadMore } = usePaginatedList({ params: { academyId, bucket }, fetchPage });

  return <section className="card table-wrap mt-3">
    {error && <p className="p-4 text-sm text-red-800 bg-red-50">{error}</p>}
    {charges === null
      ? <p className="muted text-sm p-4">Cargando…</p>
      : <table><thead><tr><th>Alumno</th><th>Concepto</th><th>Vencimiento</th><th>Importe</th><th>Estado</th></tr></thead>
        <tbody>{charges.map((charge) => <tr key={charge.id}>
          <td><Link href={`/app/students/${charge.studentId}`} className="font-bold text-[var(--brand)]">{charge.studentName}</Link></td>
          <td>{charge.description}</td>
          <td>{formatDate(charge.dueDate)}</td>
          <td>{formatMoney(charge.finalCents)}</td>
          <td><StatusBadge value={charge.status} /></td>
        </tr>)}</tbody>
      </table>}
    {charges?.length === 0 && <Empty title="Sin cuotas en este rango" detail="No hay cuotas pendientes en esta ventana de fechas." />}
    {hasMore && <div className="flex items-center justify-between p-4 border-t border-[var(--line)]"><p className="text-xs muted">Mostrando {charges?.length ?? 0}</p><button onClick={() => void loadMore()} disabled={loading} className="btn btn-secondary">{loading ? "Cargando…" : "Mostrar más"}</button></div>}
  </section>;
}

export function VencimientosTab({ academyId }: { academyId: string }) {
  const [summary, setSummary] = useState<VencimientosSummary | null>(null);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!academyId) return;
    const timer = window.setTimeout(async () => {
      const response = await fetch(`/api/billing/charges/vencimientos-summary?academyId=${academyId}`);
      if (!response.ok) { setError(await readError(response, "No se pudo cargar el resumen de vencimientos")); return; }
      setSummary(await response.json());
    }, 0);
    return () => window.clearTimeout(timer);
  }, [academyId]);

  return <>
    <p className="muted text-sm max-w-xl mb-4">Cuotas pendientes agrupadas por fecha de vencimiento. Tocá una tarjeta para ver el detalle.</p>
    {error && <p className="mb-4 rounded-xl bg-red-50 text-red-800 p-3 text-sm">{error}</p>}
    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {buckets.map(([key, label, tone]) => <button key={key} onClick={() => setExpanded(expanded === key ? null : key)} className={`text-left ${expanded === key ? "ring-2 ring-[var(--brand)] rounded-2xl" : ""}`}>
        <Metric label={label} value={summary ? String(summary[key].count) : "…"} note={summary ? formatMoney(summary[key].cents) : "Cargando…"} tone={tone} />
      </button>)}
    </div>
    {expanded && <BucketRows academyId={academyId} bucket={expanded} />}
  </>;
}
