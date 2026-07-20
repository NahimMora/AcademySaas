"use client";

import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/domain/money";
import { Modal } from "@/components/app/ui";
import type { ChargeRowDTO } from "@/lib/students/types";

const methodLabels: Record<string, string> = {
  bank_transfer: "Transferencia", mercado_pago: "Mercado Pago", debit_card: "Débito", credit_card: "Crédito", other: "Otro"
};

async function readError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null);
  return typeof body?.error === "string" ? body.error : fallback;
}

export function PayChargeModal({ studentId, academyId, charge, onClose, onPaid }: {
  studentId: string; academyId: string; charge: ChargeRowDTO; onClose(): void; onPaid(): void;
}) {
  const remainingCents = Math.max(0, charge.finalCents - charge.paidCents);
  const [amount, setAmount] = useState((remainingCents / 100).toFixed(2));
  const [method, setMethod] = useState("bank_transfer");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true); setError("");
    try {
      const amountCents = Math.round(Number(amount || "0") * 100);
      const response = await fetch("/api/payments", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ studentId, academyId, amountCents, method, chargeId: charge.id, allocationCents: Math.min(amountCents, remainingCents), idempotencyKey })
      });
      if (!response.ok) { setError(await readError(response, "No se pudo registrar el cobro")); return; }
      onPaid();
    } finally {
      setSubmitting(false);
    }
  }

  return <Modal open onClose={onClose} title="Cobrar cuota" description={`${charge.description} · saldo ${formatMoney(remainingCents)}`}>
    <form onSubmit={submit} className="grid gap-4">
      {error && <p className="rounded-xl bg-red-50 text-red-800 p-3 text-sm">{error}</p>}
      <div className="grid grid-cols-2 gap-4">
        <label className="label">Importe ARS<input className="field" type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /></label>
        <label className="label">Medio<select className="field" value={method} onChange={(e) => setMethod(e.target.value)}>{Object.entries(methodLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </div>
      <p className="rounded-xl bg-amber-50 text-amber-900 p-3 text-xs">El efectivo se cobra solo desde Caja, con la caja de la sede abierta. Acá el pago queda pendiente de validación hasta confirmarlo.</p>
      <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button><button className="btn btn-primary" disabled={submitting}>{submitting ? "Registrando…" : "Registrar"}</button></div>
    </form>
  </Modal>;
}
