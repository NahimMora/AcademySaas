"use client";

import { useState } from "react";
import { Modal } from "@/components/app/ui";

async function readError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null);
  return typeof body?.error === "string" ? body.error : fallback;
}

export function NewCourseModal({ open, onClose, academyId, onCreated }: { open: boolean; onClose(): void; academyId: string; onCreated(): void }) {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function close() { setError(""); onClose(); }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSubmitting(true); setError("");
    try {
      const response = await fetch("/api/courses", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          academyId, name: String(data.get("name")),
          estimatedDurationWeeks: Number(data.get("estimatedDurationWeeks")) || undefined,
          defaultInstallments: Number(data.get("defaultInstallments")) || 1,
          classDurationMinutes: Number(data.get("classDurationMinutes")) || undefined,
          suggestedCapacity: Number(data.get("suggestedCapacity")) || undefined,
          suggestedPriceCents: Math.round(Number(data.get("suggestedPrice") || "0") * 100)
        })
      });
      if (!response.ok) { setError(await readError(response, "No se pudo crear el curso")); return; }
      close();
      onCreated();
    } finally {
      setSubmitting(false);
    }
  }

  return <Modal open={open} onClose={close} title="Nuevo curso" description="El código se genera automáticamente. Después se crean comisiones concretas a partir de este curso.">
    {error && <p className="mb-4 rounded-xl bg-red-50 text-red-800 p-3 text-sm">{error}</p>}
    <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
      <label className="label sm:col-span-2">Nombre<input className="field" name="name" required /></label>
      <label className="label">Duración (semanas)<input className="field" name="estimatedDurationWeeks" type="number" min="1" max="260" defaultValue="12" /></label>
      <label className="label">Cuotas sugeridas<input className="field" name="defaultInstallments" type="number" min="1" max="60" defaultValue="6" /></label>
      <label className="label">Duración de clase (min)<input className="field" name="classDurationMinutes" type="number" min="1" max="600" defaultValue="120" /></label>
      <label className="label">Cupo sugerido<input className="field" name="suggestedCapacity" type="number" min="1" max="500" defaultValue="20" /></label>
      <label className="label sm:col-span-2">Precio sugerido ARS<input className="field" name="suggestedPrice" type="number" min="0" step="0.01" defaultValue="0" /></label>
      <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
        <button type="button" className="btn btn-secondary" onClick={close}>Cancelar</button>
        <button className="btn btn-primary" disabled={submitting}>{submitting ? "Creando…" : "Crear curso"}</button>
      </div>
    </form>
  </Modal>;
}
