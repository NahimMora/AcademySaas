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
import type { AcademyOption, ChargeRowDTO } from "@/lib/students/types";
import type { EnrollmentRowDTO } from "@/lib/billing/types";

type BillingCharge = ChargeRowDTO & { studentId: string; studentName: string; studentCode: string };
type BillingPayment = { id: string; reference: string | null; amountCents: number; method: string; status: string; registeredAt: string; studentId: string; studentName: string; studentCode: string; allocatedChargeId: string | null };

async function readError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null);
  return typeof body?.error === "string" ? body.error : fallback;
}

const statusFilters = [["all", "Todos los estados"], ["overdue", "Vencidos"], ["partial", "Parciales"], ["paid", "Pagados"]] as const;

export function BillingConsole() {
  const [academies, setAcademies] = useState<AcademyOption[] | null>(null);
  const [academyId, setAcademyId] = useState("");
  const [tab, setTab] = useState<"cargos" | "inscripciones">("cargos");
  const [charges, setCharges] = useState<BillingCharge[] | null>(null);
  const [payments, setPayments] = useState<BillingPayment[] | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentRowDTO[] | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [visible, setVisible] = useState(25);
  const [payCharge, setPayCharge] = useState<BillingCharge | null>(null);
  const [newPaymentOpen, setNewPaymentOpen] = useState(false);
  const [newEnrollmentOpen, setNewEnrollmentOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "inscripciones") setTab("inscripciones");
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

  const loadCharges = useCallback(async (id: string) => {
    const [chargesResponse, paymentsResponse] = await Promise.all([
      fetch(`/api/billing/charges?academyId=${id}`),
      fetch(`/api/billing/payments?academyId=${id}`)
    ]);
    if (chargesResponse.ok) setCharges((await chargesResponse.json()).charges);
    if (paymentsResponse.ok) setPayments((await paymentsResponse.json()).payments);
  }, []);

  const loadEnrollments = useCallback(async (id: string) => {
    const response = await fetch(`/api/billing/enrollments?academyId=${id}`);
    if (response.ok) setEnrollments((await response.json()).enrollments);
  }, []);

  useEffect(() => {
    if (!academyId) return;
    const timer = window.setTimeout(() => { void loadCharges(academyId); void loadEnrollments(academyId); }, 0);
    return () => window.clearTimeout(timer);
  }, [academyId, loadCharges, loadEnrollments]);

  async function confirmPayment(paymentId: string) {
    const response = await fetch("/api/payments/confirm", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ paymentId, idempotencyKey: crypto.randomUUID() }) });
    if (!response.ok) { setError(await readError(response, "No se pudo confirmar el pago")); return; }
    setSuccess("Pago confirmado."); void loadCharges(academyId);
  }

  async function reversePayment(paymentId: string) {
    const response = await fetch("/api/payments/reverse", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ paymentId, reason: "Reversión manual desde Cobros", idempotencyKey: crypto.randomUUID() }) });
    if (!response.ok) { setError(await readError(response, "No se pudo revertir el pago")); return; }
    setSuccess("Pago revertido."); void loadCharges(academyId);
  }

  if (academies === null) return <PageHeader eyebrow="Cuenta corriente" title="Cobros" description="Cargando academias…" />;
  if (academies.length === 0) return <><PageHeader eyebrow="Cuenta corriente" title="Cobros" description="Inscripciones y cuotas: quién debe, cuánto pagó y qué falta, en un solo lugar." />{error && <p className="rounded-xl bg-red-50 text-red-800 p-3 text-sm">{error}</p>}<Empty title="Sin academias asignadas" detail="Tu usuario no tiene acceso a ninguna academia." /></>;

  const filteredCharges = (charges ?? []).filter((charge) =>
    (statusFilter === "all" || charge.status === statusFilter) &&
    (!search || `${charge.studentName} ${charge.studentCode}`.toLowerCase().includes(search.toLowerCase()))
  );
  const visibleCharges = filteredCharges.slice(0, visible);
  const debt = filteredCharges.reduce((sum, charge) => sum + Math.max(0, charge.finalCents - charge.paidCents), 0);
  const unassignedPayments = (payments ?? []).filter((payment) => !payment.allocatedChargeId);

  return <>
    <PageHeader
      eyebrow="Cuenta corriente" title="Cobros" description="Inscripciones y cuotas: quién debe, cuánto pagó y qué falta, en un solo lugar."
      action={academies.length > 1 ? <select className="field" value={academyId} onChange={(e) => setAcademyId(e.target.value)}>{academies.map((academy) => <option key={academy.id} value={academy.id}>{academy.name}</option>)}</select> : undefined}
    />
    {error && <p className="mb-4 rounded-xl bg-red-50 text-red-800 p-3 text-sm">{error}</p>}
    {success && <p className="mb-4 rounded-xl bg-emerald-50 text-emerald-800 p-3 text-sm">{success}</p>}

    <div className="flex gap-2 mb-5 border-b border-[var(--line)]">
      {(["cargos", "inscripciones"] as const).map((id) => <button key={id} onClick={() => setTab(id)} className={`px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors ${tab === id ? "border-[var(--brand)] text-[var(--brand)]" : "border-transparent muted hover:text-[#0b1220]"}`}>{id === "cargos" ? "Cargos" : "Inscripciones"}</button>)}
    </div>

    {tab === "cargos" && <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <p className="muted text-sm max-w-xl">Cada fila es una cuota: cuánto se debe, cuánto se pagó y qué falta.</p>
        <button onClick={() => setNewPaymentOpen(true)} className="btn btn-secondary"><Plus size={18} /> Registrar pago</button>
      </div>
      <div className="grid sm:grid-cols-3 gap-4 mb-5">
        <Metric label="Saldo filtrado" value={formatMoney(debt)} note={`${filteredCharges.length} cargos`} />
        <Metric label="Vencidos" value={String(filteredCharges.filter((charge) => charge.status === "overdue").length)} note="Requieren seguimiento" tone="red" />
        <Metric label="Por validar" value={String((charges ?? []).filter((charge) => charge.pendingPayment).length)} note="Transferencias pendientes" tone="gold" />
      </div>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input className="field flex-1" placeholder="Buscar alumno por nombre o código…" value={search} onChange={(e) => { setSearch(e.target.value); setVisible(25); }} />
        <select className="field sm:max-w-xs" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setVisible(25); }}>{statusFilters.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      </div>
      {charges === null
        ? <p className="muted text-sm">Cargando cuotas…</p>
        : <section className="card table-wrap">
          <table><thead><tr><th>Alumno</th><th>Concepto</th><th>Vencimiento</th><th>Importe</th><th>Pagado</th><th>Estado</th><th></th></tr></thead>
            <tbody>{visibleCharges.map((charge) => <tr key={charge.id}>
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
          {visibleCharges.length === 0 && <Empty title="Sin resultados" detail="No hay cuotas que coincidan con la búsqueda." />}
        </section>}
      {filteredCharges.length > visible && <div className="flex items-center justify-between mt-4"><p className="text-xs muted">Mostrando {visibleCharges.length} de {filteredCharges.length}</p><button onClick={() => setVisible(visible + 25)} className="btn btn-secondary">Mostrar más</button></div>}

      {unassignedPayments.length > 0 && <section className="card table-wrap mt-6">
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
    </>}

    {payCharge && <PayChargeModal studentId={payCharge.studentId} academyId={academyId} charge={payCharge} onClose={() => setPayCharge(null)} onPaid={() => { setPayCharge(null); setSuccess("Cobro registrado."); void loadCharges(academyId); }} />}
    {newPaymentOpen && <NewPaymentModal academyId={academyId} onClose={() => setNewPaymentOpen(false)} onRegistered={() => { setSuccess("Pago registrado."); void loadCharges(academyId); }} />}
    {newEnrollmentOpen && <NewEnrollmentModal onClose={() => setNewEnrollmentOpen(false)} academyId={academyId} onCreated={() => { setSuccess("Alumno inscripto."); void loadEnrollments(academyId); void loadCharges(academyId); }} />}
  </>;
}
