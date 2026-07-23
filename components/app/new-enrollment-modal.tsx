"use client";

import { useEffect, useMemo, useState } from "react";
import { formatMoney } from "@/lib/domain/money";
import { Modal } from "@/components/app/ui";
import { StudentPicker } from "@/components/app/student-picker";
import type { StudentHit } from "@/lib/cash/types";
import type { CohortOption, CourseOption } from "@/lib/billing/types";

async function readError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null);
  return typeof body?.error === "string" ? body.error : fallback;
}

export function NewEnrollmentModal({ onClose, onCreated, academyId, defaultStudentId, defaultCohortId }: {
  onClose(): void; onCreated(): void; academyId: string; defaultStudentId?: string; defaultCohortId?: string;
}) {
  const [student, setStudent] = useState<StudentHit | null>(null);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [courseId, setCourseId] = useState("");
  const [cohorts, setCohorts] = useState<CohortOption[]>([]);
  const [cohortId, setCohortId] = useState(defaultCohortId ?? "");
  const [lockedCohort, setLockedCohort] = useState<CohortOption | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);

  useEffect(() => {
    if (!defaultStudentId) return;
    (async () => {
      // El alumno ya se conoce por id; buscamos su nombre completo para mostrarlo bloqueado.
      const response = await fetch(`/api/students/${defaultStudentId}`);
      if (response.ok) {
        const data = await response.json() as { student: { id: string; firstName: string; lastName: string; publicCode: string; dni: string } };
        setStudent({ id: data.student.id, firstName: data.student.firstName, lastName: data.student.lastName, publicCode: data.student.publicCode, dni: data.student.dni });
      }
    })();
  }, [defaultStudentId]);

  useEffect(() => {
    // La comisión ya se conoce por id (se llega desde su propio detalle); se bloquea en vez de re-elegirla.
    if (!defaultCohortId) return;
    (async () => {
      const response = await fetch(`/api/cohorts/${defaultCohortId}`);
      if (response.ok) {
        const data = await response.json() as { cohort: { id: string; code: string; name: string; courseId: string; courseName: string; capacity: number; installmentCents: number; installmentCount: number; roster: unknown[] } };
        setLockedCohort({
          id: data.cohort.id, code: data.cohort.code, name: data.cohort.name, courseId: data.cohort.courseId, courseName: data.cohort.courseName,
          capacity: data.cohort.capacity, enrolledCount: data.cohort.roster.length, installmentCents: data.cohort.installmentCents, installmentCount: data.cohort.installmentCount
        });
      }
    })();
  }, [defaultCohortId]);

  useEffect(() => {
    if (defaultCohortId) return;
    (async () => {
      const response = await fetch(`/api/courses?academyId=${academyId}`);
      if (response.ok) setCourses((await response.json()).courses);
    })();
  }, [academyId, defaultCohortId]);

  useEffect(() => {
    if (!courseId || defaultCohortId) return;
    (async () => {
      const response = await fetch(`/api/cohorts?academyId=${academyId}&courseId=${courseId}`);
      if (response.ok) setCohorts((await response.json()).cohorts);
    })();
  }, [academyId, courseId, defaultCohortId]);

  const cohort = defaultCohortId ? lockedCohort : cohorts.find((candidate) => candidate.id === cohortId);
  const availableCohorts = cohorts.filter((candidate) => candidate.enrolledCount < candidate.capacity);
  const price = cohort ? cohort.installmentCents * cohort.installmentCount : 0;

  function selectCourse(id: string) { setCourseId(id); setCohortId(""); setCohorts([]); }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!student || !cohort) return;
    setSubmitting(true); setError("");
    try {
      const response = await fetch("/api/enrollments", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ studentId: student.id, cohortId: cohort.id, agreedPriceCents: price, installmentCount: cohort.installmentCount, idempotencyKey })
      });
      if (!response.ok) { setError(await readError(response, "No se pudo crear la inscripción")); return; }
      onCreated();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return <Modal open onClose={onClose} title="Inscribir alumno" description="El precio y las cuotas los define la comisión elegida; acá solo se confirma quién se inscribe.">
    <form onSubmit={submit} className="grid gap-4">
      {error && <p className="rounded-xl bg-red-50 text-red-800 p-3 text-sm">{error}</p>}
      <label className="label">Alumno
        {defaultStudentId
          ? <div className="field flex items-center">{student ? <strong>{student.lastName}, {student.firstName}</strong> : <span className="muted">Cargando…</span>}</div>
          : <StudentPicker academyId={academyId} selected={student} onSelect={setStudent} />}
      </label>
      {defaultCohortId
        ? <label className="label">Comisión<div className="field flex items-center justify-between"><span><strong>{lockedCohort?.name}</strong> <span className="muted">· {lockedCohort?.courseName}</span></span></div></label>
        : <>
          <label className="label">Curso<select className="field" value={courseId} onChange={(e) => selectCourse(e.target.value)} required><option value="">Elegí un curso…</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select></label>
          <label className="label">Comisión<select className="field" value={cohortId} onChange={(e) => setCohortId(e.target.value)} required disabled={!courseId}><option value="">{courseId ? "Elegí una comisión…" : "Elegí un curso primero"}</option>{availableCohorts.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name} · {candidate.capacity - candidate.enrolledCount} vacantes</option>)}</select></label>
        </>}
      {cohort && <p className="rounded-xl bg-sky-50 p-3 text-xs text-sky-900">Precio total <strong>{formatMoney(price)}</strong> en <strong>{cohort.installmentCount}</strong> cuotas de {formatMoney(cohort.installmentCents)}.</p>}
      <div className="flex justify-end gap-2 mt-2"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button><button className="btn btn-primary" disabled={!student || !cohort || submitting}>{submitting ? "Inscribiendo…" : "Inscribir"}</button></div>
    </form>
  </Modal>;
}
