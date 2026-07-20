"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Banknote, LockKeyhole, RefreshCcw, WalletCards } from "lucide-react";
import { formatMoney } from "@/lib/domain/money";
import { formatDateTime, formatTime } from "@/lib/domain/format";
import { Empty, Metric, Modal, PageHeader } from "@/components/app/ui";
import type { BranchOption, CashMovementDTO, CashSessionDTO, PayableCharge, StudentHit } from "@/lib/cash/types";

const movementLabels: Record<CashMovementDTO["type"], string> = {
  opening: "Apertura", payment: "Cobro", reversal: "Reversión", adjustment: "Ajuste", closing: "Cierre"
};

async function readError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null);
  return typeof body?.error === "string" ? body.error : fallback;
}

export function CashConsole() {
  const [branches, setBranches] = useState<BranchOption[] | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [openSession, setOpenSession] = useState<CashSessionDTO | null | undefined>(undefined);
  const [recentClosed, setRecentClosed] = useState<CashSessionDTO[]>([]);
  const [movements, setMovements] = useState<CashMovementDTO[]>([]);
  const [loadingSession, setLoadingSession] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [openingInput, setOpeningInput] = useState("0");
  const [opening, setOpening] = useState(false);

  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [countedInput, setCountedInput] = useState("");
  const [closeNote, setCloseNote] = useState("");
  const [closing, setClosing] = useState(false);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const selectedBranch = branches?.find((branch) => branch.id === selectedBranchId);

  useEffect(() => {
    (async () => {
      const response = await fetch("/api/cash/context");
      if (!response.ok) { setError(await readError(response, "No se pudieron cargar las sedes")); setBranches([]); return; }
      const data = await response.json() as { branches: BranchOption[] };
      setBranches(data.branches);
      if (data.branches[0]) setSelectedBranchId(data.branches[0].id);
    })();
  }, []);

  const refresh = useCallback(async (branchId: string) => {
    if (!branchId) return;
    setLoadingSession(true);
    try {
      const response = await fetch(`/api/cash/sessions?branchId=${branchId}`);
      if (!response.ok) { setError(await readError(response, "No se pudo actualizar la caja")); return; }
      const data = await response.json() as { open: CashSessionDTO | null; recent: CashSessionDTO[] };
      setOpenSession(data.open);
      setRecentClosed(data.recent);
      if (data.open) {
        const movementsResponse = await fetch(`/api/cash/movements?cashSessionId=${data.open.id}`);
        if (movementsResponse.ok) setMovements((await movementsResponse.json()).movements);
      } else {
        setMovements([]);
      }
    } finally {
      setLoadingSession(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedBranchId) return;
    const timer = window.setTimeout(() => void refresh(selectedBranchId), 0);
    return () => window.clearTimeout(timer);
  }, [selectedBranchId, refresh]);

  const expectedCents = useMemo(() => {
    if (!openSession) return 0;
    const movementsSum = movements.filter((movement) => ["payment", "reversal", "adjustment"].includes(movement.type)).reduce((sum, movement) => sum + movement.amountCents, 0);
    return openSession.openingCents + movementsSum;
  }, [openSession, movements]);

  async function openCash() {
    if (!selectedBranch) return;
    setError(""); setSuccess(""); setOpening(true);
    try {
      const response = await fetch("/api/cash/open", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ branchId: selectedBranch.id, academyId: selectedBranch.academyId, openingCents: Math.round(Number(openingInput || "0") * 100) })
      });
      if (!response.ok) { setError(await readError(response, "No se pudo abrir la caja")); return; }
      setSuccess("Caja abierta.");
      setOpeningInput("0");
      await refresh(selectedBranch.id);
    } finally {
      setOpening(false);
    }
  }

  async function closeCash() {
    if (!openSession || !selectedBranch) return;
    setError(""); setClosing(true);
    try {
      const response = await fetch("/api/cash/close", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cashSessionId: openSession.id, countedCents: Math.round(Number(countedInput || "0") * 100), note: closeNote || undefined })
      });
      if (!response.ok) { setError(await readError(response, "No se pudo cerrar la caja")); return; }
      const result = await response.json() as { differenceCents: number };
      setSuccess(`Caja cerrada. Diferencia: ${formatMoney(result.differenceCents)}`);
      setCloseModalOpen(false); setCountedInput(""); setCloseNote("");
      await refresh(selectedBranch.id);
    } finally {
      setClosing(false);
    }
  }

  if (branches === null) return <PageHeader eyebrow="Recepción" title="Caja" description="Cargando sedes…" />;
  if (branches.length === 0) return <>
    <PageHeader eyebrow="Recepción" title="Caja" description="Control de efectivo real por sede." />
    {error && <p className="mb-4 rounded-xl bg-red-50 text-red-800 p-3 text-sm">{error}</p>}
    <Empty title="Sin sedes asignadas" detail="Tu usuario no tiene acceso a ninguna sede para operar caja." />
  </>;

  return <>
    <PageHeader
      eyebrow="Recepción" title="Caja" description="Apertura, cobros en efectivo y cierre con arqueo, conectados a datos reales."
      action={branches.length > 1 && <select className="field" value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)}>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select>}
    />
    {error && <p className="mb-4 rounded-xl bg-red-50 text-red-800 p-3 text-sm">{error}</p>}
    {success && <p className="mb-4 rounded-xl bg-emerald-50 text-emerald-800 p-3 text-sm">{success}</p>}

    <div className="flex justify-end mb-4"><button onClick={() => void refresh(selectedBranchId)} disabled={loadingSession} className="btn btn-secondary"><RefreshCcw size={16} className={loadingSession ? "animate-spin" : ""} /> Actualizar</button></div>

    {openSession === undefined
      ? <p className="muted text-sm">Cargando estado de la caja…</p>
      : openSession
        ? <>
          <div className="grid sm:grid-cols-3 gap-4">
            <Metric label="Estado" value="Caja abierta" note={`Desde las ${formatTime(openSession.openedAt)}`} tone="green" />
            <Metric label="Saldo inicial" value={formatMoney(openSession.openingCents)} note="Cargado al abrir" />
            <Metric label="Efectivo esperado" value={formatMoney(expectedCents)} note={`${movements.length} movimientos`} tone="blue" />
          </div>
          <div className="flex flex-wrap gap-2 mt-5">
            <button onClick={() => setPaymentModalOpen(true)} className="btn btn-primary"><Banknote size={17} /> Registrar cobro</button>
            <button onClick={() => setCloseModalOpen(true)} className="btn btn-danger"><LockKeyhole size={17} /> Cerrar caja</button>
          </div>
          <section className="card table-wrap mt-5">
            <div className="p-5 border-b border-[var(--line)]"><h3 className="font-black">Movimientos</h3></div>
            <table><thead><tr><th>Hora</th><th>Tipo</th><th>Importe</th><th>Nota</th></tr></thead>
              <tbody>{movements.map((movement) => <tr key={movement.id}><td>{formatTime(movement.createdAt)}</td><td>{movementLabels[movement.type]}</td><td className={movement.amountCents < 0 ? "text-red-700 font-bold" : ""}>{formatMoney(movement.amountCents)}</td><td className="muted">{movement.note ?? "—"}</td></tr>)}</tbody>
            </table>
            {movements.length === 0 && <Empty title="Sin movimientos todavía" detail="Los cobros en efectivo van a aparecer acá." />}
          </section>
        </>
        : <section className="card p-6">
          <h3 className="font-black">Abrir caja</h3>
          <p className="muted text-sm mt-1">Cargá el efectivo físico inicial de {selectedBranch?.name}. Los demás medios de pago se acumulan desde cero.</p>
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 mt-4">
            <label className="label sm:max-w-xs">Efectivo inicial<input className="field" type="number" min="0" value={openingInput} onChange={(e) => setOpeningInput(e.target.value)} /></label>
            <button onClick={() => void openCash()} disabled={opening} className="btn btn-primary"><WalletCards size={17} /> {opening ? "Abriendo…" : "Abrir caja"}</button>
          </div>
        </section>}

    {recentClosed.length > 0 && <section className="card table-wrap mt-5">
      <div className="p-5 border-b border-[var(--line)]"><h3 className="font-black">Cierres recientes</h3></div>
      <table><thead><tr><th>Cierre</th><th>Saldo inicial</th><th>Esperado</th><th>Contado</th><th>Diferencia</th></tr></thead>
        <tbody>{recentClosed.map((session) => <tr key={session.id}>
          <td>{session.closedAt ? formatDateTime(session.closedAt) : "—"}</td>
          <td>{formatMoney(session.openingCents)}</td>
          <td>{formatMoney(session.expectedCents ?? 0)}</td>
          <td>{formatMoney(session.countedCents ?? 0)}</td>
          <td className={`font-bold ${!session.differenceCents ? "text-emerald-700" : "text-red-700"}`}>{formatMoney(session.differenceCents ?? 0)}</td>
        </tr>)}</tbody>
      </table>
    </section>}

    {paymentModalOpen && selectedBranch && openSession && <QuickPaymentModal branch={selectedBranch} cashSessionId={openSession.id} onClose={() => setPaymentModalOpen(false)} onRegistered={() => { setSuccess("Cobro registrado."); void refresh(selectedBranch.id); }} />}

    <Modal open={closeModalOpen} onClose={() => setCloseModalOpen(false)} title="Cerrar caja" description="Contá únicamente el efectivo físico; se compara con lo esperado.">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl bg-gray-50 p-4"><p className="text-xs font-bold uppercase muted">Esperado</p><p className="mt-1 text-xl font-black">{formatMoney(expectedCents)}</p></div>
        <label className="label">Efectivo contado<input className="field" type="number" min="0" autoFocus value={countedInput} onChange={(e) => setCountedInput(e.target.value)} /></label>
      </div>
      <label className="label mt-4">Observación (opcional)<input className="field" value={closeNote} onChange={(e) => setCloseNote(e.target.value)} /></label>
      <div className="flex justify-end gap-2 mt-5"><button className="btn btn-secondary" onClick={() => setCloseModalOpen(false)}>Cancelar</button><button className="btn btn-danger" disabled={closing || countedInput.trim() === ""} onClick={() => void closeCash()}><LockKeyhole size={16} /> {closing ? "Cerrando…" : "Confirmar cierre"}</button></div>
    </Modal>
  </>;
}

function QuickPaymentModal({ branch, cashSessionId, onClose, onRegistered }: { branch: BranchOption; cashSessionId: string; onClose(): void; onRegistered(): void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudentHit[]>([]);
  const [student, setStudent] = useState<StudentHit | null>(null);
  const [charges, setCharges] = useState<PayableCharge[]>([]);
  const [chargeId, setChargeId] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);

  useEffect(() => {
    if (student || query.trim().length === 0) return;
    const timer = window.setTimeout(async () => {
      const response = await fetch(`/api/students/search?q=${encodeURIComponent(query)}&academyId=${branch.academyId}`);
      if (response.ok) setResults((await response.json()).students);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, student, branch.academyId]);

  useEffect(() => {
    if (!student) return;
    (async () => {
      const response = await fetch(`/api/charges?studentId=${student.id}`);
      if (response.ok) setCharges((await response.json()).charges);
    })();
  }, [student]);

  const charge = charges.find((candidate) => candidate.id === chargeId);

  function pickStudent(hit: StudentHit) { setStudent(hit); setResults([]); }
  function changeStudent() { setStudent(null); setQuery(""); setResults([]); setCharges([]); setChargeId(""); setAmount(""); }
  function pickCharge(id: string) {
    setChargeId(id);
    const selected = charges.find((candidate) => candidate.id === id);
    if (selected) setAmount((selected.remainingCents / 100).toFixed(2));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!student) return;
    setSubmitting(true); setError("");
    try {
      const amountCents = Math.round(Number(amount || "0") * 100);
      const response = await fetch("/api/cash/payments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          cashSessionId, branchId: branch.id, academyId: branch.academyId, studentId: student.id,
          amountCents, chargeId: chargeId || undefined,
          allocationCents: chargeId ? Math.min(amountCents, charge?.remainingCents ?? amountCents) : undefined,
          idempotencyKey
        })
      });
      if (!response.ok) { setError(await readError(response, "No se pudo registrar el cobro")); return; }
      onRegistered();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return <Modal open onClose={onClose} title="Registrar cobro" description="Solo efectivo. Transferencias y otros medios se registran desde Cobros.">
    <form onSubmit={submit} className="grid gap-4">
      {error && <p className="rounded-xl bg-red-50 text-red-800 p-3 text-sm">{error}</p>}
      <label className="label">Alumno
        {student
          ? <div className="field flex items-center justify-between"><span><strong>{student.lastName}, {student.firstName}</strong> <span className="muted">· {student.publicCode}</span></span><button type="button" onClick={changeStudent} className="text-xs font-bold text-[var(--brand)]">Cambiar</button></div>
          : <div className="relative">
            <input className="field" placeholder="Buscar por nombre, código o DNI…" value={query} onChange={(e) => { const value = e.target.value; setQuery(value); if (!value.trim()) setResults([]); }} autoComplete="off" />
            {results.length > 0 && <div className="absolute z-10 mt-1 w-full card p-1 max-h-56 overflow-y-auto">{results.map((hit) => <button type="button" key={hit.id} onClick={() => pickStudent(hit)} className="block w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-[var(--brand-soft)]">{hit.lastName}, {hit.firstName} <span className="muted text-xs">· {hit.publicCode}</span></button>)}</div>}
          </div>}
      </label>
      {student && <label className="label">Cuota
        <select className="field" value={chargeId} onChange={(e) => pickCharge(e.target.value)}><option value="">Seña / sin asignar</option>{charges.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.description} · saldo {formatMoney(candidate.remainingCents)}</option>)}</select>
        {charges.length === 0 && <p className="text-xs muted mt-1">Este alumno no tiene cuotas pendientes.</p>}
      </label>}
      <label className="label">Importe ARS<input className="field" type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /></label>
      <p className="rounded-xl bg-amber-50 text-amber-900 p-3 text-xs">Este flujo solo admite pagos en efectivo, confirmados al instante contra la caja abierta.</p>
      <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button><button className="btn btn-primary" disabled={!student || submitting}>{submitting ? "Registrando…" : "Registrar"}</button></div>
    </form>
  </Modal>;
}
