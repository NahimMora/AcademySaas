"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BadgeCheck, ChevronRight, Filter, Plus, Search } from "lucide-react";
import { formatDate } from "@/lib/domain/format";
import { Empty, Modal, PageHeader, StatusBadge } from "@/components/app/ui";
import type { AcademyOption, StudentListItemDTO } from "@/lib/students/types";

function normalizeSearch(text: string) { return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }

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

const statusOptions = [["all", "Todos"], ["active", "Activos"], ["inactive", "Inactivos"], ["blocked", "Bloqueados"], ["archived", "Archivados"]] as const;

function NewStudentModal({ open, onClose, academyId, onCreated }: { open: boolean; onClose(): void; academyId: string; onCreated(publicCode: string): void }) {
  const [step, setStep] = useState<"student" | "guardian">("student");
  const [pending, setPending] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function close() { setStep("student"); setPending(null); setError(""); onClose(); }

  function submitStudent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const birthDate = String(data.get("birthDate"));
    const base = { firstName: String(data.get("firstName")), lastName: String(data.get("lastName")), dni: String(data.get("dni")).replace(/\D/g, ""), birthDate, phone: String(data.get("phone")), email: String(data.get("email")) || "" };
    if (calculateAge(birthDate) < 18) { setPending(base); setStep("guardian"); return; }
    void submit(base, null);
  }

  function submitGuardian(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pending) return;
    const data = new FormData(event.currentTarget);
    void submit(pending, { firstName: String(data.get("guardianFirstName")), lastName: String(data.get("guardianLastName")), relationship: String(data.get("guardianRelationship")), phone: String(data.get("guardianPhone")) });
  }

  async function submit(base: Record<string, string>, guardian: Record<string, string> | null) {
    setSubmitting(true); setError("");
    try {
      const response = await fetch("/api/students", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ academyId, ...base, email: base.email || undefined, guardian: guardian ?? undefined })
      });
      if (!response.ok) { setError(await readError(response, "No se pudo crear el alumno")); return; }
      const result = await response.json() as { publicCode: string };
      close();
      onCreated(result.publicCode);
    } finally {
      setSubmitting(false);
    }
  }

  return <Modal open={open} onClose={close} title={step === "student" ? "Nuevo alumno" : "Datos del tutor"} description={step === "student" ? "El DNI se valida como único dentro del workspace." : "El alumno es menor de edad: se requiere un tutor responsable antes de crear el legajo."}>
    {error && <p className="mb-4 rounded-xl bg-red-50 text-red-800 p-3 text-sm">{error}</p>}
    {step === "student"
      ? <form key="student-step" onSubmit={submitStudent} className="grid sm:grid-cols-2 gap-4">
        <label className="label">Nombre<input className="field" name="firstName" required /></label>
        <label className="label">Apellido<input className="field" name="lastName" required /></label>
        <label className="label">DNI<input className="field" name="dni" inputMode="numeric" minLength={7} required /></label>
        <label className="label">Fecha de nacimiento<input className="field" name="birthDate" type="date" required /></label>
        <label className="label">Teléfono<input className="field" name="phone" required /></label>
        <label className="label">Correo (opcional)<input className="field" name="email" type="email" /></label>
        <div className="sm:col-span-2 rounded-xl bg-sky-50 p-3 text-xs text-sky-900">Si la fecha indica minoría de edad, el siguiente paso va a pedir los datos de un tutor.</div>
        <div className="sm:col-span-2 flex justify-end gap-2 mt-2"><button type="button" className="btn btn-secondary" onClick={close}>Cancelar</button><button className="btn btn-primary" disabled={submitting}>{submitting ? "Creando…" : "Continuar"}</button></div>
      </form>
      : <form key="guardian-step" onSubmit={submitGuardian} autoComplete="off" className="grid sm:grid-cols-2 gap-4">
        <label className="label">Nombre del tutor<input className="field" name="guardianFirstName" autoComplete="off" required /></label>
        <label className="label">Apellido del tutor<input className="field" name="guardianLastName" autoComplete="off" required /></label>
        <label className="label">Vínculo<input className="field" name="guardianRelationship" autoComplete="off" placeholder="Madre, padre, tutor legal…" required /></label>
        <label className="label">Teléfono del tutor<input className="field" name="guardianPhone" autoComplete="off" required /></label>
        <div className="sm:col-span-2 flex justify-end gap-2 mt-2"><button type="button" className="btn btn-secondary" onClick={() => setStep("student")}>Volver</button><button className="btn btn-primary" disabled={submitting}>{submitting ? "Creando…" : "Crear legajo"}</button></div>
      </form>}
  </Modal>;
}

export function StudentsConsole() {
  const [academies, setAcademies] = useState<AcademyOption[] | null>(null);
  const [academyId, setAcademyId] = useState("");
  const [students, setStudents] = useState<StudentListItemDTO[] | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visible, setVisible] = useState(25);
  const [newStudentOpen, setNewStudentOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const response = await fetch("/api/academies/context");
      if (!response.ok) { setError(await readError(response, "No se pudieron cargar las academias")); setAcademies([]); return; }
      const data = await response.json() as { academies: AcademyOption[] };
      setAcademies(data.academies);
      if (data.academies[0]) setAcademyId(data.academies[0].id);
    })();
  }, []);

  async function loadStudents(id: string) {
    if (!id) return;
    const response = await fetch(`/api/students?academyId=${id}`);
    if (!response.ok) { setError(await readError(response, "No se pudieron cargar los alumnos")); return; }
    const data = await response.json() as { students: StudentListItemDTO[] };
    setStudents(data.students);
  }

  useEffect(() => {
    if (!academyId) return;
    const timer = window.setTimeout(() => void loadStudents(academyId), 0);
    return () => window.clearTimeout(timer);
  }, [academyId]);

  const filtered = (students ?? []).filter((student) =>
    (statusFilter === "all" || student.status === statusFilter) &&
    normalizeSearch(`${student.firstName} ${student.lastName} ${student.dniMasked} ${student.publicCode}`).includes(normalizeSearch(search))
  );
  const list = filtered.slice(0, visible);

  if (academies === null) return <PageHeader eyebrow="Legajos" title="Alumnos" description="Cargando academias…" />;
  if (academies.length === 0) return <><PageHeader eyebrow="Legajos" title="Alumnos" description="Datos administrativos, inscripciones, pagos y asistencia en una sola ficha." />{error && <p className="rounded-xl bg-red-50 text-red-800 p-3 text-sm">{error}</p>}<Empty title="Sin academias asignadas" detail="Tu usuario no tiene acceso a ninguna academia." /></>;

  return <>
    <PageHeader
      eyebrow="Legajos" title="Alumnos" description="Datos administrativos, inscripciones, pagos y asistencia en una sola ficha."
      action={<div className="flex gap-2 items-center">
        {academies.length > 1 && <select className="field" value={academyId} onChange={(e) => setAcademyId(e.target.value)}>{academies.map((academy) => <option key={academy.id} value={academy.id}>{academy.name}</option>)}</select>}
        <button onClick={() => setNewStudentOpen(true)} className="btn btn-primary"><Plus size={18} /> Nuevo alumno</button>
      </div>}
    />
    {error && <p className="mb-4 rounded-xl bg-red-50 text-red-800 p-3 text-sm">{error}</p>}
    {success && <p className="mb-4 rounded-xl bg-emerald-50 text-emerald-800 p-3 text-sm flex gap-2"><BadgeCheck size={18} />{success}</p>}

    <div className="mb-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <label className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 muted" size={18} /><input className="field pl-10" value={search} onChange={(e) => { setSearch(e.target.value); setVisible(25); }} placeholder="Buscar por nombre, código o DNI…" /></label>
        <button onClick={() => setFiltersOpen(!filtersOpen)} className={`btn ${filtersOpen || statusFilter !== "all" ? "btn-primary" : "btn-secondary"}`}><Filter size={17} /> Filtros{statusFilter !== "all" ? " · 1" : ""}</button>
      </div>
      {filtersOpen && <div className="mt-3 p-3 rounded-xl border border-[var(--line)] flex flex-wrap gap-2">
        {statusOptions.map(([value, label]) => <button key={value} onClick={() => { setStatusFilter(value); setVisible(25); }} className={`btn ${statusFilter === value ? "btn-primary" : "btn-secondary"}`}>{label}</button>)}
      </div>}
    </div>

    {students === null
      ? <p className="muted text-sm">Cargando alumnos…</p>
      : <section className="card table-wrap">
        <table><thead><tr><th>Alumno</th><th>DNI</th><th>Contacto</th><th>Estado</th><th>Alta</th><th></th></tr></thead>
          <tbody>{list.map((student) => <tr key={student.id}>
            <td><Link href={`/app/students/${student.id}`} className="flex items-center gap-3"><span className="grid place-items-center size-9 rounded-xl bg-[var(--brand-soft)] text-[var(--brand)] font-black text-xs">{student.firstName[0]}{student.lastName[0]}</span><span><strong>{student.lastName}, {student.firstName}</strong><small className="block muted">{student.publicCode}{student.hasGuardian ? " · Menor con tutor" : ""}</small></span></Link></td>
            <td>{student.dniMasked}</td>
            <td>{student.phone}<small className="block muted">{student.email ?? "Sin correo"}</small></td>
            <td><StatusBadge value={student.status} /></td>
            <td>{formatDate(student.createdAt)}</td>
            <td><Link href={`/app/students/${student.id}`} aria-label="Ver alumno"><ChevronRight size={18} /></Link></td>
          </tr>)}</tbody>
        </table>
        {list.length === 0 && <Empty title="Sin resultados" detail="No hay alumnos que coincidan con la búsqueda." />}
      </section>}
    {filtered.length > visible && <div className="flex items-center justify-between mt-4"><p className="text-xs muted">Mostrando {list.length} de {filtered.length}</p><button onClick={() => setVisible(visible + 25)} className="btn btn-secondary">Mostrar más</button></div>}

    <NewStudentModal open={newStudentOpen} onClose={() => setNewStudentOpen(false)} academyId={academyId} onCreated={(publicCode) => { setSuccess(`Alumno dado de alta con código ${publicCode}.`); void loadStudents(academyId); }} />
  </>;
}
