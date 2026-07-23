"use client";

import { useCallback, useEffect, useState } from "react";
import { Check } from "lucide-react";
import { formatShortDate } from "@/lib/domain/format";
import { Empty, Modal, StatusBadge } from "@/components/app/ui";
import type { ClassDetailDTO } from "@/lib/classes/types";

async function readError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null);
  return typeof body?.error === "string" ? body.error : fallback;
}

const attendanceOptions = [["present", "Presente"], ["late", "Tarde"], ["absent", "Ausente"]] as const;

export function AttendanceModal({ classId, onClose, onChanged, readOnly = false }: { classId: string; onClose(): void; onChanged(): void; readOnly?: boolean }) {
  const [detail, setDetail] = useState<ClassDetailDTO | null>(null);
  const [error, setError] = useState("");
  const [confirmClose, setConfirmClose] = useState(false);
  const [closing, setClosing] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch(`/api/classes/${classId}`);
    if (!response.ok) { setError(await readError(response, "No se pudo cargar la clase")); return; }
    const data = await response.json() as { class: ClassDetailDTO };
    setDetail(data.class);
  }, [classId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function mark(enrollmentId: string, status: string) {
    const response = await fetch(`/api/classes/${classId}/attendance`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ enrollmentId, status })
    });
    if (!response.ok) { setError(await readError(response, "No se pudo guardar la asistencia")); return; }
    setConfirmClose(false);
    void load();
  }

  const unmarkedCount = detail?.roster.filter((row) => !row.status).length ?? 0;

  async function handleClose() {
    if (unmarkedCount > 0 && !confirmClose) { setConfirmClose(true); return; }
    setClosing(true); setError("");
    try {
      const response = await fetch(`/api/classes/${classId}/close`, { method: "POST", headers: { "content-type": "application/json" } });
      if (!response.ok) { setError(await readError(response, "No se pudo cerrar la asistencia")); return; }
      await load();
      onChanged();
    } finally {
      setClosing(false);
    }
  }

  return <Modal open onClose={onClose} title="Asistencia" description={readOnly ? "Registro de solo lectura." : "La lista se deriva de inscripciones elegibles y se bloquea al cerrar."}>
    {error && <p className="mb-4 rounded-xl bg-red-50 text-red-800 p-3 text-sm">{error}</p>}
    {detail === null
      ? <p className="muted text-sm">Cargando…</p>
      : <section>
        <div className="rounded-2xl bg-[var(--sidebar)] text-white p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <p className="text-xs text-white/60">{formatShortDate(`${detail.sessionDate}T12:00:00Z`)} · {detail.startsAt} — {detail.endsAt} · {detail.instructorName ?? "Sin profesor"}</p>
            <h3 className="text-xl font-black mt-1">{detail.cohortName}</h3>
            <p className="text-sm text-white/65 mt-1">{detail.roster.length} alumnos en nómina · {detail.attendanceClosed ? "Cerrada" : "Ventana abierta"}</p>
          </div>
        </div>
        <div className="divide-y divide-[var(--line)] max-h-[45vh] overflow-y-auto mt-2">
          {detail.roster.map((row) => <div key={row.enrollmentId} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 flex-1"><span className="grid place-items-center size-10 rounded-xl bg-[var(--brand-soft)] text-[var(--brand)] font-black text-xs">{row.studentName.slice(0, 2).toUpperCase()}</span><span><strong>{row.studentName}</strong><small className="block muted">{row.studentCode}</small></span></div>
            {!readOnly && !detail.attendanceClosed
              ? <div className="grid grid-cols-3 gap-1">{attendanceOptions.map(([value, label]) => <button key={value} onClick={() => void mark(row.enrollmentId, value)} className={`min-h-10 rounded-xl px-3 text-xs font-bold border ${row.status === value ? (value === "absent" ? "bg-red-50 border-red-300 text-red-800" : "bg-[var(--brand-soft)] border-blue-200 text-[var(--brand)]") : "border-[var(--line)]"}`}>{label}</button>)}</div>
              : <StatusBadge value={row.status ?? "pending"} />}
          </div>)}
          {detail.roster.length === 0 && <Empty title="Sin nómina" detail="No hay inscripciones elegibles para esta clase." />}
        </div>
        {!readOnly && <footer className="pt-4 mt-2 border-t border-[var(--line)] grid gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs muted">{detail.attendanceClosed ? "Asistencia cerrada." : `${unmarkedCount > 0 ? `${unmarkedCount} alumnos sin marcar.` : "Todos marcados."}`}</p>
            <button disabled={detail.attendanceClosed || closing} onClick={() => void handleClose()} className={`btn ${confirmClose ? "btn-danger" : "btn-primary"}`}><Check size={17} />{detail.attendanceClosed ? "Cerrada" : closing ? "Cerrando…" : confirmClose ? "Confirmar cierre igual" : "Cerrar asistencia"}</button>
          </div>
          {confirmClose && !detail.attendanceClosed && <p className="text-xs text-amber-700">Quedan {unmarkedCount} alumnos sin marcar: al cerrar quedan como ausentes. Tocá de nuevo para confirmar.</p>}
        </footer>}
      </section>}
  </Modal>;
}
