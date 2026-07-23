"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/domain/format";
import { formatMoney } from "@/lib/domain/money";
import { Empty, Metric, PageHeader, StatusBadge } from "@/components/app/ui";
import { NewEnrollmentModal } from "@/components/app/new-enrollment-modal";
import { PayChargeModal } from "@/components/app/pay-charge-modal";
import { NewPaymentModal } from "@/components/app/new-payment-modal";
import { usePaginatedList } from "@/components/app/hooks/use-paginated-list";
import { VencimientosTab } from "@/components/app/vencimientos-tab";
import type { AcademyOption, ChargeRowDTO } from "@/lib/students/types";
import type { EnrollmentRowDTO } from "@/lib/billing/types";

type BillingCharge = ChargeRowDTO & { studentId: string; studentName: string; studentCode: string };
type BillingPayment = { id: string; reference: string | null; amountCents: number; method: string; status: string; registeredAt: string; studentId: string; studentName: string; studentCode: string; allocatedChargeId: string | null };
type ChargesSummary = { debtCents: number; overdueCount: number; pendingValidationCount: number };

async function readError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null);
  return typeof body?.error === "string" ? body.error : fallback;
}

const statusFilters = [["all", "Todos los estados"], ["overdue", "Vencidos"], ["partial", "Parciales"], ["paid", "Pagados"]] as const;

export function BillingConsole() {
  const [academies, setAcademies] = useState<AcademyOption[] | null>(null);
  const [academyId, setAcademyId] = useState("");
  const [tab, setTab] = useState<"cargos" | "inscripciones" | "vencimientos">("cargos");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [summary, setSummary] = useState<ChargesSummary | null>(null);
  const [payCharge, setPayCharge] = useState<BillingCharge | null>(null);
  const [newPaymentOpen, setNewPaymentOpen] = useState(false);
  const [newEnrollmentOpen, setNewEnrollmentOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const requested = params.get("tab");
      if (requested === "inscripciones" || requested === "vencimientos") setTab(requested);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

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

  const fetchChargesPage = useCallback(async (params: { academyId: string; status: string; q: string }, page: number, pageSize: number) => {
    const query = new URLSearchParams({ academyId: params.academyId, status: params.status, page: String(page), pageSize: String(pageSize) });
    if (params.q) query.set("q", params.q);
    const response = await fetch(`/api/billing/charges?${query.toString()}`);
    if (!response.ok) { setError(await readError(response, "No se pudieron cargar las cuotas")); return { items: [], hasMore: false }; }
    const data = await response.json() as { charges: BillingCharge[]; hasMore: boolean };
    return { items: data.charges, hasMore: data.hasMore };
  }, []);

  const fetchUnassignedPaymentsPage = useCallback(async (params: { academyId: string }, page: number, pageSize: number) => {
    const query = new URLSearchParams({ academyId: params.academyId, unassigned: "true", page: String(page), pageSize: String(pageSize) });
    const response = await fetch(`/api/billing/payments?${query.toString()}`);
    if (!response.ok) { setError(await readError(response, "No se pudieron cargar los pagos")); return { items: [], hasMore: false }; }
    const data = await response.json() as { payments: BillingPayment[]; hasMore: boolean };
    return { items: data.payments, hasMore: data.hasMore };
  }, []);

  const fetchEnrollmentsPage = useCallback(async (params: { academyId: string }, page: number, pageSize: number) => {
    const query = new URLSearchParams({ academyId: params.academyId, page: String(page), pageSize: String(pageSize) });
    const response = await fetch(`/api/billing/enrollments?${query.toString()}`);
    if (!response.ok) { setError(await readError(response, "No se pudieron cargar las inscripciones")); return { items: [], hasMore: false }; }
    const data = await response.json() as { enrollments: EnrollmentRowDTO[]; hasMore: boolean };
    return { items: data.enrollments, hasMore: data.hasMore };
  }, []);

  const chargesList = usePaginatedList({
    params: academyId ? { academyId, status: statusFilter, q: debouncedSearch } : null,
    fetchPage: fetchChargesPage
  });
  const unassignedList = usePaginatedList({
    params: academyId ? { academyId } : null,
    fetchPage: fetchUnassignedPaymentsPage
  });
  const enrollmentsList = usePaginatedList({
    params: academyId ? { academyId } : null,
    fetchPage: fetchEnrollmentsPage
  });

  const loadSummary = useCallback(async (id: string, status: string, q: string) => {
    const query = new URLSearchParams({ academyId: id, status });
    if (q) query.set("q", q);
    const response = await fetch(`/api/billing/charges/summary?${query.toString()}`);
    if (response.ok) setSummary(await response.json());
  }, []);

  useEffect(() => {
    if (!academyId) return;
    const timer = window.setTimeout(() => void loadSummary(academyId, statusFilter, debouncedSearch), 0);
    return () => window.clearTimeout(timer);
  }, [academyId, statusFilter, debouncedSearch, loadSummary]);

  function reloadCharges() {
    chargesList.reload();
    unassignedList.reload();
    void loadSummary(academyId, statusFilter, debouncedSearch);
  }

  async function confirmPayment(paymentId: string) {
    const response = await fetch("/api/payments/confirm", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ paymentId, idempotencyKey: crypto.randomUUID() }) });
    if (!response.ok) { setError(await readError(response, "No se pudo confirmar el pago")); return; }
    setSuccess("Pago confirmado."); reloadCharges();
  }

  async function reversePayment(paymentId: string) {
    const response = await fetch("/api/payments/reverse", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ paymentId, reason: "Reversión manual desde Cobros", idempotencyKey: crypto.randomUUID() }) });
    if (!response.ok) { setError(await readError(response, "No se pudo revertir el pago")); return; }
    setSuccess("Pago revertido."); reloadCharges();
  }

  if (academies === null) return <PageHeader eyebrow="Cuenta corriente" title="Cobros" description="Cargando academias…" />;
  if (academies.length === 0) return <><PageHeader eyebrow="Cuenta corriente" title="Cobros" description="Inscripciones y cuotas: quién debe, cuánto pagó y qué falta, en un solo lugar." />{error && <p className="rounded-xl bg-red-50 text-red-800 p-3 text-sm">{error}</p>}<Empty title="Sin academias asignadas" detail="Tu usuario no tiene acceso a ninguna academia." /></>;

  const charges = chargesList.items;
  const unassignedPayments = unassignedList.items;
  const enrollments = enrollmentsList.items;

  return <>
    <PageHeader
      eyebrow="Cuenta corriente" title="Cobros" description="Inscripciones y cuotas: quién debe, cuánto pagó y qué falta, en un solo lugar."
      action={academies.length > 1 ? <select className="field" value={academyId} onChange={(e) => setAcademyId(e.target.value)}>{academies.map((academy) => <option key={academy.id} value={academy.id}>{academy.name}</option>)}</select> : undefined}
    />
    {error && <p className="mb-4 rounded-xl bg-red-50 text-red-800 p-3 text-sm">{error}</p>}
    {success && <p className="mb-4 rounded-xl bg-emerald-50 text-emerald-800 p-3 text-sm">{success}</p>}

    <div className="flex gap-2 mb-5 border-b border-[var(--line)]">
      {([["cargos", "Cargos"], ["inscripciones", "Inscripciones"], ["vencimientos", "Vencimientos"]] as const).map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors ${tab === id ? "border-[var(--brand)] text-[var(--brand)]" : "border-transparent muted hover:text-[#0b1220]"}`}>{label}</button>)}
    </div>

    {tab === "cargos" && <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <p className="muted text-sm max-w-xl">Cada fila es una cuota: cuánto se debe, cuánto se pagó y qué falta.</p>
        <button onClick={() => setNewPaymentOpen(true)} className="btn btn-secondary"><Plus size={18} /> Registrar pago</button>
      </div>
      <div className="grid sm:grid-cols-3 gap-4 mb-5">
        <Metric label="Saldo filtrado" value={formatMoney(summary?.debtCents ?? 0)} note="Según el filtro actual" />
        <Metric label="Vencidos" value={String(summary?.overdueCount ?? 0)} note="Requieren seguimiento" tone="red" />
        <Metric label="Por validar" value={String(summary?.pendingValidationCount ?? 0)} note="Transferencias pendientes" tone="gold" />
      </div>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input className="field flex-1" placeholder="Buscar alumno por nombre o código…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="field sm:max-w-xs" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>{statusFilters.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      </div>
      {charges === null
        ? <p className="muted text-sm">Cargando cuotas…</p>
        : <section className="card table-wrap">
          <table><thead><tr><th>Alumno</th><th>Concepto</th><th>Vencimiento</th><th>Importe</th><th>Pagado</th><th>Estado</th><th></th></tr></thead>
            <tbody>{charges.map((charge) => <tr key={charge.id}>
              <td><Link href={`/app/students/${charge.studentId}`} className="font-bold text-[var(--brand)]">{charge.studentName}</Link></td>
              <td>{charge.description}</td>
              <td>{formatDate(charge.dueDate)}</td>
              <td>{formatMoney(charge.finalCents)}</td>
              <td>{formatMoney(charge.paidCents)}</td>
              <td><StatusBadge value={charge.status} /></td>
              <td>{charge.pendingPayment
                ? <button onClick={() => void confirmPayment(charge.pendingPayment!.id)} className="text-xs font-bold text-[var(--brand)]">Confirmar</button>
                : charge.status === "paid"
                  ? (charge.confirmedPaymentId && <button onClick={() => void reversePayment(charge.confirmedPaymentId!)} className="text-xs font-bold text-red-700">Revertir</button>)
                  : <button onClick={() => setPayCharge(charge)} className="text-xs font-bold text-[var(--brand)]">Cobrar</button>}</td>
            </tr>)}</tbody>
          </table>
          {charges.length === 0 && <Empty title="Sin resultados" detail="No hay cuotas que coincidan con la búsqueda." />}
        </section>}
      {chargesList.hasMore && <div className="flex items-center justify-between mt-4"><p className="text-xs muted">Mostrando {charges?.length ?? 0}</p><button onClick={() => void chargesList.loadMore()} disabled={chargesList.loading} className="btn btn-secondary">{chargesList.loading ? "Cargando…" : "Mostrar más"}</button></div>}

      {unassignedPayments !== null && unassignedPayments.length > 0 && <section className="card table-wrap mt-6">
        <div className="p-5 border-b border-[var(--line)]"><h3 className="font-black">Pagos sin asignar</h3><p className="muted text-xs mt-1">Señas registradas sin un cargo puntual todavía.</p></div>
        <table><thead><tr><th>Comprobante</th><th>Alumno</th><th>Fecha</th><th>Medio</th><th>Importe</th><th>Estado</th><th></th></tr></thead>
          <tbody>{unassignedPayments.map((payment) => <tr key={payment.id}>
            <td><strong>{payment.reference ?? "—"}</strong></td>
            <td>{payment.studentName}</td>
            <td>{formatDateTime(payment.registeredAt)}</td>
            <td>{payment.method.replaceAll("_", " ")}</td>
            <td>{formatMoney(payment.amountCents)}</td>
            <td><StatusBadge value={payment.status} /></td>
            <td>{payment.status === "pending_validation"
              ? <button className="text-xs font-bold text-[var(--brand)]" onClick={() => void confirmPayment(payment.id)}>Confirmar</button>
              : payment.status === "confirmed"
                ? <button className="text-xs font-bold text-red-700" onClick={() => void reversePayment(payment.id)}>Revertir</button>
                : null}</td>
          </tr>)}</tbody>
        </table>
        {unassignedList.hasMore && <div className="flex items-center justify-between p-4 border-t border-[var(--line)]"><p className="text-xs muted">Mostrando {unassignedPayments.length}</p><button onClick={() => void unassignedList.loadMore()} disabled={unassignedList.loading} className="btn btn-secondary">{unassignedList.loading ? "Cargando…" : "Mostrar más"}</button></div>}
      </section>}
    </>}

    {tab === "inscripciones" && <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <p className="muted text-sm max-w-xl">El alta reserva cupo y genera las cuotas en una única operación transaccional.</p>
        <button onClick={() => setNewEnrollmentOpen(true)} className="btn btn-primary"><Plus size={18} /> Inscribir alumno</button>
      </div>
      {enrollments === null
        ? <p className="muted text-sm">Cargando inscripciones…</p>
        : <section className="card table-wrap">
          <table><thead><tr><th>Alumno</th><th>Comisión</th><th>Precio</th><th>Cuotas</th><th>Inscripción</th><th>Pago</th></tr></thead>
            <tbody>{enrollments.map((enrollment) => <tr key={enrollment.id}>
              <td><Link href={`/app/students/${enrollment.studentId}`} className="font-bold text-[var(--brand)]">{enrollment.studentName}</Link></td>
              <td>{enrollment.cohortName}</td>
              <td>{formatMoney(enrollment.agreedPriceCents)}</td>
              <td>{enrollment.installmentCount}</td>
              <td><StatusBadge value={enrollment.status} /></td>
              <td>{enrollment.chargesTotal === 0
                ? <span className="muted text-xs">Sin cuotas</span>
                : enrollment.balanceCents > 0
                  ? <span className="text-amber-700 font-bold text-xs">{enrollment.chargesPaid}/{enrollment.chargesTotal} · debe {formatMoney(enrollment.balanceCents)}</span>
                  : <span className="text-emerald-700 font-bold text-xs">{enrollment.chargesPaid}/{enrollment.chargesTotal} · al día</span>}</td>
            </tr>)}</tbody>
          </table>
          {enrollments.length === 0 && <Empty title="Sin inscripciones" detail="Todavía no hay inscripciones en esta academia." />}
        </section>}
      {enrollmentsList.hasMore && <div className="flex items-center justify-between mt-4"><p className="text-xs muted">Mostrando {enrollments?.length ?? 0}</p><button onClick={() => void enrollmentsList.loadMore()} disabled={enrollmentsList.loading} className="btn btn-secondary">{enrollmentsList.loading ? "Cargando…" : "Mostrar más"}</button></div>}
    </>}

    {tab === "vencimientos" && <VencimientosTab academyId={academyId} />}

    {payCharge && <PayChargeModal studentId={payCharge.studentId} academyId={academyId} charge={payCharge} onClose={() => setPayCharge(null)} onPaid={() => { setPayCharge(null); setSuccess("Cobro registrado."); reloadCharges(); }} />}
    {newPaymentOpen && <NewPaymentModal academyId={academyId} onClose={() => setNewPaymentOpen(false)} onRegistered={() => { setSuccess("Pago registrado."); reloadCharges(); }} />}
    {newEnrollmentOpen && <NewEnrollmentModal onClose={() => setNewEnrollmentOpen(false)} academyId={academyId} onCreated={() => { setSuccess("Alumno inscripto."); enrollmentsList.reload(); reloadCharges(); }} />}
  </>;
}
