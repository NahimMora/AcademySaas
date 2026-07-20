"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { formatMoney } from "@/lib/domain/money";
import { formatDate } from "@/lib/domain/format";
import { Empty, Modal, StatusBadge } from "@/components/app/ui";
import { NewEnrollmentModal } from "@/components/app/new-enrollment-modal";
import { PayChargeModal } from "@/components/app/pay-charge-modal";
import type { StudentDetailDTO, ChargeRowDTO, PaymentRowDTO } from "@/lib/students/types";

function calculateAge(birthDate: string, today = new Date()): number {
  const dob = new Date(`${birthDate}T00:00:00`);
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age;
}

async function readError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null);
  return typeof body?.error === "string" ? body.error : fallback;
}

export function StudentDetailView({ id }: { id: string }) {
  const [student, setStudent] = useState<StudentDetailDTO | null | undefined>(undefined);
  const [charges, setCharges] = useState<ChargeRowDTO[]>([]);
  const [payments, setPayments] = useState<PaymentRowDTO[]>([]);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [payCharge, setPayCharge] = useState<ChargeRowDTO | null>(null);

  const load = useCallback(async () => {
    const response = await fetch(`/api/students/${id}`);
    if (response.status === 404) { setNotFound(true); return; }
    if (!response.ok) { setError(await readError(response, "No se pudo cargar el alumno")); return; }
    const data = await response.json() as { student: StudentDetailDTO; charges: ChargeRowDTO[]; payments: PaymentRowDTO[] };
    setStudent(data.student);
    setCharges(data.charges);
    setPayments(data.payments);
  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  if (notFound) return <Empty title="Alumno no encontrado" detail="El legajo no existe o pertenece a otro workspace." />;
  if (student === undefined) return <p className="muted text-sm">Cargando…</p>;
  if (student === null) return <Empty title="Alumno no encontrado" detail="El legajo no existe o pertenece a otro workspace." />;

  return <>
    <Link href="/app/students" className="text-sm font-bold text-[var(--brand)]">← Volver a alumnos</Link>
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-5 mb-6">
      <span className="grid place-items-center size-20 rounded-3xl bg-[var(--brand-soft)] text-[var(--brand)] text-2xl font-black">{student.firstName[0]}{student.lastName[0]}</span>
      <div>
        <div className="flex gap-2"><span className="badge">{student.publicCode}</span><StatusBadge value={student.status} /></div>
        <h2 className="text-3xl font-black mt-2">{student.firstName} {student.lastName}</h2>
        <p className="muted text-sm">DNI ••.{student.dni.slice(-3)} · Alta {formatDate(student.createdAt)}</p>
      </div>
      <div className="flex gap-2 sm:ml-auto">
        <button onClick={() => setEnrollOpen(true)} className="btn btn-primary"><Plus size={17} /> Inscribir en comisión</button>
        <button onClick={() => setEditOpen(true)} className="btn btn-secondary">Editar legajo</button>
      </div>
    </div>

    {error && <p className="mb-4 rounded-xl bg-red-50 text-red-800 p-3 text-sm">{error}</p>}

    <div className="grid xl:grid-cols-[1fr_.42fr] gap-5">
      <div className="grid gap-5">
        <section className="card p-6">
          <h3 className="font-black">Inscripción actual</h3>
          {student.enrollment
            ? <div className="grid sm:grid-cols-3 gap-4 mt-5">
              <span><small className="block muted">Comisión</small><strong>{student.enrollment.cohortName}</strong></span>
              <span><small className="block muted">Estado</small><StatusBadge value={student.enrollment.status} /></span>
              <span><small className="block muted">Plan</small><strong>{student.enrollment.installmentCount} cuotas</strong></span>
            </div>
            : <p className="muted mt-4">Sin inscripción vigente.</p>}
        </section>
        <section className="card table-wrap">
          <div className="p-5 border-b border-[var(--line)]"><h3 className="font-black">Cuenta corriente</h3></div>
          <table><thead><tr><th>Concepto</th><th>Importe</th><th>Pagado</th><th>Estado</th><th></th></tr></thead>
            <tbody>{charges.map((charge) => <tr key={charge.id}>
              <td>{charge.description}</td>
              <td>{formatMoney(charge.finalCents)}</td>
              <td>{formatMoney(charge.paidCents)}</td>
              <td><StatusBadge value={charge.status} /></td>
              <td>{charge.status === "paid"
                ? null
                : charge.pendingPayment
                  ? <span className="text-xs muted">{charge.pendingPayment.method.replaceAll("_", " ")} por validar</span>
                  : <button onClick={() => setPayCharge(charge)} className="text-xs font-bold text-[var(--brand)]">Cobrar</button>}</td>
            </tr>)}</tbody>
          </table>
          {charges.length === 0 && <Empty title="Sin cuotas" detail="Este alumno todavía no tiene cargos generados." />}
        </section>
        <section className="card table-wrap">
          <div className="p-5 border-b border-[var(--line)]"><h3 className="font-black">Pagos</h3></div>
          <table><thead><tr><th>Comprobante</th><th>Importe</th><th>Medio</th><th>Estado</th></tr></thead>
            <tbody>{payments.map((payment) => <tr key={payment.id}><td>{payment.reference ?? "—"}</td><td>{formatMoney(payment.amountCents)}</td><td>{payment.method.replaceAll("_", " ")}</td><td><StatusBadge value={payment.status} /></td></tr>)}</tbody>
          </table>
          {payments.length === 0 && <Empty title="Sin pagos" detail="Todavía no se registraron pagos para este alumno." />}
        </section>
      </div>
      <aside className="grid gap-5 content-start">
        <section className="card p-6">
          <h3 className="font-black">Contacto</h3>
          <p className="mt-4 text-sm">{student.phone}</p>
          <p className="muted text-sm mt-1">{student.email ?? "Sin correo"}</p>
          {student.guardian && <div className="border-t border-[var(--line)] mt-4 pt-4">
            <small className="muted">Tutor principal</small>
            <strong className="block mt-1">{student.guardian.firstName} {student.guardian.lastName}</strong>
            <p className="text-sm">{student.guardian.relationship} · {student.guardian.phone}</p>
          </div>}
        </section>
      </aside>
    </div>

    {editOpen && <EditStudentModal onClose={() => setEditOpen(false)} student={student} onSaved={() => { setEditOpen(false); void load(); }} />}
    {payCharge && <PayChargeModal studentId={student.id} academyId={student.academyId} charge={payCharge} onClose={() => setPayCharge(null)} onPaid={() => { setPayCharge(null); void load(); }} />}
    {enrollOpen && <NewEnrollmentModal onClose={() => setEnrollOpen(false)} academyId={student.academyId} defaultStudentId={student.id} onCreated={() => { setEnrollOpen(false); void load(); }} />}
  </>;
}

function EditStudentModal({ onClose, student, onSaved }: { onClose(): void; student: StudentDetailDTO; onSaved(): void }) {
  const [birthDate, setBirthDate] = useState(student.birthDate);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isMinor = calculateAge(birthDate) < 18;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true); setError("");
    try {
      const data = new FormData(event.currentTarget);
      const guardian = isMinor ? {
        firstName: String(data.get("guardianFirstName")), lastName: String(data.get("guardianLastName")),
        relationship: String(data.get("guardianRelationship")), phone: String(data.get("guardianPhone"))
      } : undefined;
      const response = await fetch(`/api/students/${student.id}`, {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          firstName: String(data.get("firstName")), lastName: String(data.get("lastName")),
          dni: String(data.get("dni")).replace(/\D/g, ""), birthDate,
          phone: String(data.get("phone")), email: String(data.get("email")) || undefined,
          status: String(data.get("status")), guardian
        })
      });
      if (!response.ok) { setError(await readError(response, "No se pudo guardar")); return; }
      onSaved();
    } finally {
      setSubmitting(false);
    }
  }

  return <Modal open onClose={onClose} title="Editar legajo" description="Datos administrativos del alumno, incluida su fecha de nacimiento, estado y tutor.">
    <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
      {error && <p className="sm:col-span-2 rounded-xl bg-red-50 text-red-800 p-3 text-sm">{error}</p>}
      <label className="label">Nombre<input className="field" name="firstName" defaultValue={student.firstName} required /></label>
      <label className="label">Apellido<input className="field" name="lastName" defaultValue={student.lastName} required /></label>
      <label className="label">DNI<input className="field" name="dni" inputMode="numeric" minLength={7} defaultValue={student.dni} required /></label>
      <label className="label">Fecha de nacimiento<input className="field" name="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required /></label>
      <label className="label">Teléfono<input className="field" name="phone" defaultValue={student.phone} required /></label>
      <label className="label">Correo (opcional)<input className="field" name="email" type="email" defaultValue={student.email ?? ""} /></label>
      <label className="label sm:col-span-2">Estado<select className="field" name="status" defaultValue={student.status}><option value="active">Activo</option><option value="inactive">Inactivo</option><option value="blocked">Bloqueado</option><option value="archived">Archivado</option></select></label>
      {isMinor && <>
        <div className="sm:col-span-2 rounded-xl bg-sky-50 p-3 text-xs text-sky-900">La fecha indica minoría de edad: se requieren los datos del tutor.</div>
        <label className="label">Nombre del tutor<input className="field" name="guardianFirstName" autoComplete="off" defaultValue={student.guardian?.firstName} required /></label>
        <label className="label">Apellido del tutor<input className="field" name="guardianLastName" autoComplete="off" defaultValue={student.guardian?.lastName} required /></label>
        <label className="label">Vínculo<input className="field" name="guardianRelationship" autoComplete="off" defaultValue={student.guardian?.relationship} placeholder="Madre, padre, tutor legal…" required /></label>
        <label className="label">Teléfono del tutor<input className="field" name="guardianPhone" autoComplete="off" defaultValue={student.guardian?.phone} required /></label>
      </>}
      <div className="sm:col-span-2 flex justify-end gap-2 mt-2"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button><button className="btn btn-primary" disabled={submitting}>{submitting ? "Guardando…" : "Guardar cambios"}</button></div>
    </form>
  </Modal>;
}
