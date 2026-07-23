"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Modal } from "@/components/app/ui";
import { MoneyInput } from "@/components/app/money-input";
import { businessToday } from "@/lib/domain/format";
import type { AcademyOption } from "@/lib/students/types";
import type { CourseOption } from "@/lib/billing/types";

type BranchOption = { id: string; name: string; academyId: string };
type TeacherOption = { userId: string; fullName: string };
type ScheduleRow = { weekday: number; startsAt: string; endsAt: string };

const weekdayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const letterAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

async function readError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null);
  return typeof body?.error === "string" ? body.error : fallback;
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

// PRNG determinístico simple sembrado por seed: alcanza para "3 letras que cambian al elegir otro curso
// o tocar Generar otro", sin necesitar aleatoriedad criptográfica. Sembrarlo con la seed (en vez de
// Math.random) además hace que useMemo dependa de verdad de [courseId, nameRegenKey].
function seededLetters(seed: string, count: number): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  let out = "";
  for (let i = 0; i < count; i++) { h = (h * 1103515245 + 12345) | 0; out += letterAlphabet[Math.abs(h) % letterAlphabet.length]; }
  return out;
}

export function NewCohortModal({ onClose, onCreated, defaultCourseId, academyId: fixedAcademyId }: {
  onClose(): void; onCreated(): void; defaultCourseId?: string; academyId?: string;
}) {
  const [academies, setAcademies] = useState<AcademyOption[] | null>(null);
  const [academyId, setAcademyId] = useState(fixedAcademyId ?? "");
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [courseId, setCourseId] = useState(defaultCourseId ?? "");
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [branchId, setBranchId] = useState("");
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [instructorUserId, setInstructorUserId] = useState("");
  const [nameRegenKey, setNameRegenKey] = useState(0);
  const [startDate, setStartDate] = useState(businessToday);
  const [estimatedEndDate, setEstimatedEndDate] = useState("");
  const [endDateTouched, setEndDateTouched] = useState(false);
  const [capacity, setCapacity] = useState("20");
  const [installmentCount, setInstallmentCount] = useState("");
  const [installmentCountTouched, setInstallmentCountTouched] = useState(false);
  const [installmentPrice, setInstallmentPrice] = useState("");
  const [installmentPriceTouched, setInstallmentPriceTouched] = useState(false);
  const [dueDay, setDueDay] = useState("10");
  const [commissionPercent, setCommissionPercent] = useState("40");
  const [debtPolicy, setDebtPolicy] = useState("allow_with_warning");
  const [scheduleDays, setScheduleDays] = useState<ScheduleRow[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);

  useEffect(() => {
    if (fixedAcademyId) return;
    (async () => {
      const response = await fetch("/api/academies/context");
      if (response.ok) {
        const data = await response.json() as { academies: AcademyOption[] };
        setAcademies(data.academies);
        if (data.academies[0]) setAcademyId(data.academies[0].id);
      }
    })();
  }, [fixedAcademyId]);

  useEffect(() => {
    if (!academyId) return;
    (async () => {
      const [coursesRes, branchesRes, teachersRes] = await Promise.all([
        fetch(`/api/courses?academyId=${academyId}`),
        fetch("/api/cash/context"),
        fetch(`/api/teachers?academyId=${academyId}`)
      ]);
      if (coursesRes.ok) setCourses((await coursesRes.json()).courses);
      if (branchesRes.ok) {
        const data = await branchesRes.json() as { branches: (BranchOption & { academyId: string })[] };
        setBranches(data.branches.filter((branch) => branch.academyId === academyId));
      }
      if (teachersRes.ok) setTeachers((await teachersRes.json()).teachers);
    })();
  }, [academyId]);

  function toggleWeekday(weekday: number) {
    setScheduleDays((current) => current.some((day) => day.weekday === weekday)
      ? current.filter((day) => day.weekday !== weekday)
      : [...current, { weekday, startsAt: "18:00", endsAt: "20:00" }].sort((a, b) => a.weekday - b.weekday));
  }
  function updateScheduleTime(weekday: number, field: "startsAt" | "endsAt", value: string) {
    setScheduleDays((current) => current.map((day) => (day.weekday === weekday ? { ...day, [field]: value } : day)));
  }

  const selectedCourse = courses.find((course) => course.id === courseId);

  // Nombre de la comisión: nombre_del_curso + 3 letras mayúsculas al azar (regenerables), nunca a mano.
  // Igual que idempotencyKey más abajo, useMemo alcanza para "generar una vez y mantener" sin useEffect.
  const nameSuffix = useMemo(() => seededLetters(`${courseId}-${nameRegenKey}`, 3), [courseId, nameRegenKey]);
  const generatedName = selectedCourse ? `${selectedCourse.name}_${nameSuffix}` : "";

  // Cuotas, precio de cuota y fecha de fin se calculan solas a partir del curso elegido (1 cuota
  // por mes de duración, precio = precio sugerido del curso / cantidad de cuotas), salvo que la
  // persona ya haya tocado ese campo a mano. Todo derivado en el render, no en un efecto: es
  // estado puramente derivado, no una sincronización con algo externo.
  const computedInstallmentCount = selectedCourse?.estimatedDurationWeeks ? Math.max(1, Math.round(selectedCourse.estimatedDurationWeeks / 4.345)) : null;
  const displayedInstallmentCount = installmentCountTouched || !computedInstallmentCount ? installmentCount : String(computedInstallmentCount);
  const installmentsNum = Math.max(1, Math.round(Number(displayedInstallmentCount)) || 1);

  const computedInstallmentPriceCents = selectedCourse?.suggestedPriceCents ? Math.round(selectedCourse.suggestedPriceCents / installmentsNum) : null;
  const displayedInstallmentPrice = installmentPriceTouched || !computedInstallmentPriceCents ? installmentPrice : (computedInstallmentPriceCents / 100).toFixed(2);

  const computedEndDate = startDate && selectedCourse?.estimatedDurationWeeks ? addDays(startDate, selectedCourse.estimatedDurationWeeks * 7) : "";
  const displayedEndDate = endDateTouched ? estimatedEndDate : computedEndDate;

  function close() { setError(""); onClose(); }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (scheduleDays.length === 0) { setError("Elegí al menos un día de cursada."); return; }
    if (!generatedName) { setError("Elegí un curso primero."); return; }
    setSubmitting(true); setError("");
    try {
      const response = await fetch("/api/cohorts", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          academyId, branchId, courseId, name: generatedName, instructorUserId: instructorUserId || null,
          startDate, estimatedEndDate: displayedEndDate, capacity: Number(capacity), installmentCount: installmentsNum,
          installmentCents: Math.round(Number(displayedInstallmentPrice || "0") * 100), dueDay: Number(dueDay),
          commissionBps: Math.round(Math.max(0, Math.min(100, Number(commissionPercent))) * 100), debtPolicy,
          scheduleDays: scheduleDays.map((day) => ({ weekday: day.weekday, startsAt: day.startsAt, endsAt: day.endsAt })),
          idempotencyKey
        })
      });
      if (!response.ok) { setError(await readError(response, "No se pudo crear la comisión")); return; }
      close();
      onCreated();
    } finally {
      setSubmitting(false);
    }
  }

  return <Modal open onClose={close} title="Nueva comisión" description="Fechas concretas y horario semanal: de acá se generan las clases automáticamente.">
    {error && <p className="mb-4 rounded-xl bg-red-50 text-red-800 p-3 text-sm">{error}</p>}
    <form onSubmit={submit} className="grid gap-6">
      {!fixedAcademyId && academies && academies.length > 1 && <label className="label">Academia<select className="field" value={academyId} onChange={(e) => setAcademyId(e.target.value)}>{academies.map((academy) => <option key={academy.id} value={academy.id}>{academy.name}</option>)}</select></label>}

      <div className="grid sm:grid-cols-2 gap-4">
        <h4 className="sm:col-span-2 text-xs font-bold uppercase muted tracking-wide">Curso, sede y profesor</h4>
        {defaultCourseId
          ? <label className="label sm:col-span-2">Curso<div className="field flex items-center"><strong>{selectedCourse?.name}</strong></div></label>
          : <label className="label sm:col-span-2">Curso<select className="field" value={courseId} onChange={(e) => setCourseId(e.target.value)} required><option value="">Elegí un curso…</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select></label>}
        <label className="label">Sede<select className="field" value={branchId} onChange={(e) => setBranchId(e.target.value)} required><option value="">Elegí una sede…</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>
        <label className="label">Profesor<select className="field" value={instructorUserId} onChange={(e) => setInstructorUserId(e.target.value)}><option value="">Sin asignar (a definir)</option>{teachers.map((teacher) => <option key={teacher.userId} value={teacher.userId}>{teacher.fullName}</option>)}</select></label>
        <label className="label sm:col-span-2">Nombre de la comisión
          <div className="field flex items-center justify-between gap-2">
            <strong>{generatedName || "Elegí un curso para generar el nombre…"}</strong>
            {selectedCourse && <button type="button" onClick={() => setNameRegenKey((k) => k + 1)} className="text-xs font-bold text-[var(--brand)] flex items-center gap-1 shrink-0"><RefreshCw size={13} /> Generar otro</button>}
          </div>
          <p className="text-xs muted mt-1">Automático: nombre del curso + 3 letras al azar.</p>
        </label>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 pt-5 border-t border-[var(--line)]">
        <h4 className="sm:col-span-2 text-xs font-bold uppercase muted tracking-wide">Fechas y días de cursada</h4>
        <label className="label">Fecha de inicio<input className="field" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required /></label>
        <label className="label">Fecha estimada de fin<input className="field" type="date" value={displayedEndDate} onChange={(e) => { setEstimatedEndDate(e.target.value); setEndDateTouched(true); }} required /><p className="text-xs muted mt-1">{endDateTouched ? "Ajustada a mano." : "Calculada sola según la duración del curso."}</p></label>
        <div className="sm:col-span-2">
          <p className="label mb-1">Días de cursada</p>
          <div className="flex flex-wrap gap-2">{weekdayNames.map((label, weekday) => <button type="button" key={weekday} onClick={() => toggleWeekday(weekday)} className={`btn ${scheduleDays.some((day) => day.weekday === weekday) ? "btn-primary" : "btn-secondary"}`}>{label}</button>)}</div>
          <p className="text-xs muted mt-1">Podés elegir varios días con horarios distintos; las clases se generan solas entre la fecha de inicio y fin.</p>
        </div>
        {scheduleDays.length > 0 && <div className="sm:col-span-2 grid gap-2">
          {scheduleDays.map((day) => <div key={day.weekday} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
            <strong className="w-24 text-sm">{weekdayNames[day.weekday]}</strong>
            <input className="field" type="time" value={day.startsAt} onChange={(e) => updateScheduleTime(day.weekday, "startsAt", e.target.value)} required />
            <span className="muted text-sm">a</span>
            <input className="field" type="time" value={day.endsAt} onChange={(e) => updateScheduleTime(day.weekday, "endsAt", e.target.value)} required />
          </div>)}
        </div>}
      </div>

      <div className="grid sm:grid-cols-2 gap-4 pt-5 border-t border-[var(--line)]">
        <h4 className="sm:col-span-2 text-xs font-bold uppercase muted tracking-wide">Cupo, plan de pago y comisión</h4>
        <label className="label">Cupo máximo<input className="field" type="number" min="1" max="500" value={capacity} onChange={(e) => setCapacity(e.target.value)} required /></label>
        <label className="label">Día de vencimiento (1-28)<input className="field" type="number" min="1" max="28" value={dueDay} onChange={(e) => setDueDay(e.target.value)} required /></label>
        <label className="label">Cantidad de cuotas<input className="field" type="number" min="1" max="60" value={displayedInstallmentCount} onChange={(e) => { setInstallmentCount(e.target.value); setInstallmentCountTouched(true); }} required /><p className="text-xs muted mt-1">{installmentCountTouched ? "Ajustada a mano." : "1 cuota por mes de duración del curso."}</p></label>
        <label className="label">Valor de cada cuota ARS<MoneyInput value={displayedInstallmentPrice} onChange={(v) => { setInstallmentPrice(v); setInstallmentPriceTouched(true); }} required /><p className="text-xs muted mt-1">{installmentPriceTouched ? "Ajustado a mano." : "Precio del curso dividido en cuotas."}</p></label>
        <label className="label">Comisión docente (%)<input className="field" type="number" min="0" max="100" step="1" value={commissionPercent} onChange={(e) => setCommissionPercent(e.target.value)} required /></label>
        <label className="label">Política de deuda<select className="field" value={debtPolicy} onChange={(e) => setDebtPolicy(e.target.value)}><option value="inform_only">Solo informar</option><option value="allow_with_warning">Permitir con advertencia</option><option value="block_if_overdue">Bloquear si está vencida</option><option value="block_if_no_confirmed_payment">Bloquear sin pago confirmado</option><option value="manual_review">Revisión manual</option></select></label>
      </div>

      <div className="flex justify-end gap-2"><button type="button" className="btn btn-secondary" onClick={close}>Cancelar</button><button className="btn btn-primary" disabled={submitting}>{submitting ? "Creando…" : "Crear comisión"}</button></div>
    </form>
  </Modal>;
}
