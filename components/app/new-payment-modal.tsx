"use client";

import { useEffect, useMemo, useState } from "react";
import { formatMoney } from "@/lib/domain/money";
import { Modal } from "@/components/app/ui";
import { StudentPicker } from "@/components/app/student-picker";
import { MoneyInput } from "@/components/app/money-input";
import type { StudentHit, PayableCharge, BranchOption } from "@/lib/cash/types";

const methodLabels: Record<string, string> = {
  bank_transfer: "Transferencia", mercado_pago: "Mercado Pago", debit_card: "Débito", credit_card: "Crédito", other: "Otro"
};

async function readError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null);
  return typeof body?.error === "string" ? body.error : fallback;
}

export function NewPaymentModal({ academyId, onClose, onRegistered }: { academyId: string; onClose(): void; onRegistered(): void }) {
  const [student, setStudent] = useState<StudentHit | null>(null);
  const [charges, setCharges] = useState<PayableCharge[]>([]);
  const [chargeId, setChargeId] = useState("");
  const [branches, setBranches] = useState<BranchOption[] | null>(null);
  const [branchId, setBranchId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bank_transfer");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);

  useEffect(() => {
    if (!student) return;
    (async () => {
      const response = await fetch(`/api/charges?studentId=${student.id}`);
      if (response.ok) setCharges((await response.json()).charges);
    })();
  }, [student]);

  function selectStudent(hit: StudentHit | null) {
    setStudent(hit);
    setCharges([]);
    setChargeId("");
  }

  useEffect(() => {
    if (chargeId || branches) return;
    (async () => {
      const response = await fetch("/api/cash/context");
      if (response.ok) {
        const data = await response.json() as { branches: BranchOption[] };
        setBranches(data.branches);
        if (data.branches[0]) setBranchId(data.branches[0].id);
      }
    })();
  }, [chargeId, branches]);

  const charge = charges.find((candidate) => candidate.id === chargeId);

  function pickCharge(id: string) {
    setChargeId(id);
    const selected = charges.find((candidate) => candidate.id === id);
    if (selected) setAmount((selected.remainingCents / 100).toFixed(2));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!student) return;
    if (!chargeId && !branchId) { setError("Elegí una sede"); return; }
    setSubmitting(true); setError("");
    try {
      const amountCents = Math.round(Number(amount || "0") * 100);
      const response = await fetch("/api/payments", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          studentId: student.id, academyId, amountCents, method,
          chargeId: chargeId || undefined,
          allocationCents: chargeId ? Math.min(amountCents, charge?.remainingCents ?? amountCents) : undefined,
          branchId: chargeId ? undefined : branchId,
          idempotencyKey
        })
      });
      if (!response.ok) { setError(await readError(response, "No se pudo registrar el pago")); return; }
      onRegistered();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return <Modal open onClose={onClose} title="Registrar pago" description="La asignación no puede superar el saldo del cargo.">
    <form onSubmit={submit} className="grid gap-4">
      {error && <p className="rounded-xl bg-red-50 text-red-800 p-3 text-sm">{error}</p>}
      <label className="label">Alumno<StudentPicker academyId={academyId} selected={student} onSelect={selectStudent} /></label>
      {student && <label className="label">Cargo
        <select className="field" value={chargeId} onChange={(e) => pickCharge(e.target.value)}><option value="">Seña / sin asignar</option>{charges.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.description} · saldo {formatMoney(candidate.remainingCents)}</option>)}</select>
      </label>}
      {!chargeId && student && <label className="label">Sede<select className="field" value={branchId} onChange={(e) => setBranchId(e.target.value)}>{(branches ?? []).map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>}
      <div className="grid grid-cols-2 gap-4">
        <label className="label">Importe ARS<MoneyInput value={amount} onChange={setAmount} required /></label>
        <label className="label">Medio<select className="field" value={method} onChange={(e) => setMethod(e.target.value)}>{Object.entries(methodLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </div>
      <p className="rounded-xl bg-amber-50 text-amber-900 p-3 text-xs">El efectivo se cobra solo desde Caja, con la caja de la sede abierta. Acá el pago queda pendiente de validación hasta confirmarlo.</p>
      <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button><button className="btn btn-primary" disabled={!student || submitting}>{submitting ? "Registrando…" : "Registrar"}</button></div>
    </form>
  </Modal>;
}
