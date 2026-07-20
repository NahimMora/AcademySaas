"use client";

import { X } from "lucide-react";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between mb-6"><div>{eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}<h2 className="text-2xl sm:text-[2rem] leading-tight font-black tracking-[-.035em]">{title}</h2><p className="muted mt-2 text-sm max-w-2xl">{description}</p></div>{action && <div className="shrink-0">{action}</div>}</div>;
}

export function Metric({ label, value, note, tone = "green" }: { label: string; value: string; note: string; tone?: "green" | "gold" | "red" | "blue" }) {
  const colors = { green: "bg-emerald-50 text-emerald-800", gold: "bg-amber-50 text-amber-800", red: "bg-red-50 text-red-800", blue: "bg-indigo-50 text-indigo-700" };
  return <article className="card p-5"><div className={`size-2 rounded-full ${colors[tone]} mb-4`}/><p className="text-xs font-bold muted">{label}</p><strong className="metric-value block text-2xl font-black mt-1">{value}</strong><p className="text-xs muted mt-2">{note}</p></article>;
}

export function Modal({ open, onClose, title, description, children }: { open: boolean; onClose(): void; title: string; description?: string; children: React.ReactNode }) {
  if (!open) return null;
  return <div className="fixed z-[80] inset-0 bg-[#0b1220]/60 backdrop-blur-sm grid place-items-end sm:place-items-center p-0 sm:p-5" onMouseDown={(e) => { if (e.currentTarget === e.target) onClose(); }}><section role="dialog" aria-modal="true" className="bg-white w-full sm:max-w-xl max-h-[92vh] overflow-auto rounded-t-[24px] sm:rounded-[24px] shadow-2xl"><header className="sticky top-0 bg-white z-10 flex items-start gap-4 p-5 sm:p-6 border-b border-[var(--line)]"><div><h3 className="text-xl font-black">{title}</h3>{description && <p className="muted text-sm mt-1">{description}</p>}</div><button onClick={onClose} className="ml-auto p-2 rounded-xl hover:bg-gray-100" aria-label="Cerrar"><X/></button></header><div className="p-5 sm:p-6">{children}</div></section></div>;
}

export function StatusBadge({ value }: { value: string }) {
  const success = ["active", "confirmed", "attending", "paid", "authorized", "approved", "resolved", "open", "completed", "present"];
  const danger = ["blocked", "denied", "rejected", "reversed", "cancelled", "suspended", "critical", "absent"];
  const warning = ["pending", "pending_validation", "partial", "overdue", "warning", "under_review", "trial", "past_due", "scheduled", "late"];
  const labels: Record<string, string> = { active: "Activo", inactive: "Inactivo", blocked: "Bloqueado", archived: "Archivado", confirmed: "Confirmado", pending_validation: "Por validar", rejected: "Rechazado", reversed: "Revertido", attending: "Cursando", overdue: "Con deuda", dropped_out: "Abandono", pending: "Pendiente", partial: "Parcial", paid: "Pagado", cancelled: "Cancelado", authorized: "Autorizado", warning: "Advertencia", denied: "Denegado", approved: "Aprobada", resolved: "Resuelta", under_review: "En revisión", new: "Nueva", open: "Abierta", closed: "Cerrada", completed: "Completada", scheduled: "Programada", trial: "Prueba", suspended: "Suspendido", past_due: "Pago vencido", medium: "Media", high: "Alta", low: "Baja", critical: "Crítica", info: "Info", present: "Presente", late: "Tarde", absent: "Ausente" };
  const tone = success.includes(value) ? "badge-success" : danger.includes(value) ? "badge-danger" : warning.includes(value) ? "badge-warning" : "";
  return <span className={`badge ${tone}`}>{labels[value] ?? value.replaceAll("_", " ")}</span>;
}

export function Empty({ title, detail }: { title: string; detail: string }) { return <div className="card p-10 text-center"><h3 className="font-black">{title}</h3><p className="muted text-sm mt-2">{detail}</p></div>; }
