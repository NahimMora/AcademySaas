"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { initialDemoState } from "@/lib/demo/seed";
import { chargeStatus } from "@/lib/domain/money";
import { settlementBase } from "@/lib/domain/settlements";
import type { AlertItem, AttendanceRecord, Charge, Checkin, ClassSession, Cohort, Course, DemoState, Enrollment, Payment, PlatformUser, RequestItem, Student, Workspace } from "@/lib/domain/types";

function codeFromName(name: string, existingCodes: string[], fallback = "GEN"): string {
  const base = (name.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().match(/[A-Z]+/g)?.[0] ?? fallback).slice(0, 3) || fallback;
  let code = base;
  let suffix = 2;
  while (existingCodes.includes(code)) { code = `${base}${suffix}`; suffix += 1; }
  return code;
}

// Aplica (o deshace, con delta negativo) un pago sobre el saldo de un cargo y
// recalcula su estado. Sin esto, un pago se registra pero el cargo que dice
// pagar nunca refleja que se cobró.
function reconcileCharge(charges: Charge[], chargeId: string | undefined, deltaCents: number): Charge[] {
  if (!chargeId) return charges;
  return charges.map((charge) => {
    if (charge.id !== chargeId) return charge;
    const paidCents = Math.max(0, Math.min(charge.amountCents, charge.paidCents + deltaCents));
    return { ...charge, paidCents, status: chargeStatus(charge.amountCents, paidCents, charge.dueDate) };
  });
}

interface DemoContextValue {
  state: DemoState;
  addStudent(student: Omit<Student, "id" | "publicCode" | "createdAt" | "qrCode">): Student;
  addCohort(cohort: Omit<Cohort, "id" | "enrolled" | "code">): Cohort;
  addEnrollment(enrollment: Omit<Enrollment, "id" | "enrolledAt">): Enrollment;
  updateStudent(id: string, patch: Partial<Pick<Student, "firstName" | "lastName" | "phone" | "email" | "dni" | "birthDate" | "status" | "guardian">>): void;
  regenerateQr(id: string): void;
  addCourse(course: Omit<Course, "id" | "code">): Course;
  addPayment(payment: Omit<Payment, "id" | "registeredAt" | "reference">): Payment;
  updatePayment(id: string, status: Payment["status"]): void;
  assignPayment(paymentId: string, chargeId: string): void;
  closeSettlements(): void;
  addCheckin(checkin: Omit<Checkin, "id" | "createdAt">): void;
  updateRequest(id: string, status: RequestItem["status"]): void;
  updateAlert(id: string, status: AlertItem["status"]): void;
  setAttendance(classId: string, studentId: string, status: AttendanceRecord["status"]): void;
  closeAttendance(classId: string): void;
  addClass(session: Omit<ClassSession, "id" | "attendanceClosed">): ClassSession;
  addClassesForCohort(input: { cohortId: string; workspaceId: string; weekdays: string[]; startsAt: string; durationMonths: number }): number;
  readNotifications(): void;
  updateWorkspace(id: string, patch: Partial<Pick<Workspace, "plan" | "nextReview" | "billingNote">>): void;
  createWorkspace(input: { name: string; plan: string; nextReview: string }): Workspace;
  suspendWorkspace(id: string, reason: string): void;
  reactivateWorkspace(id: string): void;
  enterSupport(id: string, reason: string): void;
  inviteUser(input: Omit<PlatformUser, "id" | "status" | "lastAccess">): PlatformUser;
  reset(): void;
}

const DemoContext = createContext<DemoContextValue | null>(null);
// Subir este número cada vez que se agregan campos nuevos y obligatorios al
// estado (Course/Cohort/etc): una snapshot vieja en el navegador del usuario
// no los tiene y produce valores undefined/NaN en las páginas que los leen.
const storageKey = "academia-demo-state-v5";

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(initialDemoState);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    // La hidratación desde persistencia externa requiere una única actualización inicial.
    if (saved) try {
      const parsed = JSON.parse(saved) as DemoState;
      // Red de seguridad además del número de versión: si a la snapshot le
      // falta alguna clave de nivel superior (se agregó un campo nuevo al
      // estado y alguien se olvidó de subir storageKey), se descarta sola en
      // vez de romper cualquier pantalla que lea ese campo como undefined.
      const isComplete = Object.keys(initialDemoState).every((key) => key in parsed);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (isComplete) setState(parsed); else localStorage.removeItem(storageKey);
    } catch { localStorage.removeItem(storageKey); }
    setHydrated(true);
  }, []);
  useEffect(() => { if (hydrated) localStorage.setItem(storageKey, JSON.stringify(state)); }, [state, hydrated]);

  const value = useMemo<DemoContextValue>(() => ({
    state,
    addStudent(input) {
      const id = `student-local-${crypto.randomUUID()}`;
      const student: Student = { ...input, id, publicCode: `ALU-${String(state.students.length + 1).padStart(4, "0")}`, qrCode: `ACA-${crypto.randomUUID().slice(0, 10).toUpperCase()}`, createdAt: new Date().toISOString() };
      setState((current) => ({ ...current, students: [student, ...current.students], audit: [{ id: crypto.randomUUID(), workspaceId: student.workspaceId, actor: "Usuario demo", action: "student.created", entity: "student", detail: `${student.firstName} ${student.lastName} fue dado de alta`, createdAt: new Date().toISOString() }, ...current.audit] }));
      return student;
    },
    addCohort(input) {
      const courseCode = state.courses.find((item) => item.name === input.course)?.code ?? codeFromName(input.course, []);
      const sequence = state.cohorts.filter((item) => item.code.startsWith(`${courseCode}-`)).length + 1;
      const cohort: Cohort = { ...input, id: `cohort-local-${crypto.randomUUID()}`, enrolled: 0, code: `${courseCode}-26-${String(sequence).padStart(2, "0")}` };
      setState((current) => ({ ...current, cohorts: [cohort, ...current.cohorts], audit: [{ id: crypto.randomUUID(), workspaceId: cohort.workspaceId, actor: "Usuario demo", action: "cohort.created", entity: "cohort", detail: `${cohort.name} creada para ${cohort.instructor}`, createdAt: new Date().toISOString() }, ...current.audit] }));
      return cohort;
    },
    addEnrollment(input) {
      const enrollment: Enrollment = { ...input, id: `enrollment-local-${crypto.randomUUID()}`, enrolledAt: new Date().toISOString() };
      const cohort = state.cohorts.find((item) => item.id === enrollment.cohortId);
      const cadenceDays = cohort ? Math.max(1, Math.round((cohort.durationMonths * 30) / enrollment.installments)) : 30;
      const perInstallment = Math.floor(enrollment.agreedPriceCents / enrollment.installments);
      const remainder = enrollment.agreedPriceCents - perInstallment * enrollment.installments;
      const charges: Charge[] = Array.from({ length: enrollment.installments }, (_, index) => ({
        id: `charge-local-${crypto.randomUUID()}`,
        workspaceId: enrollment.workspaceId,
        studentId: enrollment.studentId,
        enrollmentId: enrollment.id,
        concept: `Cuota ${index + 1}/${enrollment.installments}`,
        amountCents: index === enrollment.installments - 1 ? perInstallment + remainder : perInstallment,
        paidCents: 0,
        dueDate: new Date(Date.now() + (index + 1) * cadenceDays * 86_400_000).toISOString().slice(0, 10),
        status: "pending",
        commissionable: true
      }));
      setState((current) => ({
        ...current,
        enrollments: [enrollment, ...current.enrollments],
        charges: [...charges, ...current.charges],
        cohorts: current.cohorts.map((item) => item.id === enrollment.cohortId ? { ...item, enrolled: item.enrolled + 1 } : item),
        audit: [{ id: crypto.randomUUID(), workspaceId: enrollment.workspaceId, actor: "Usuario demo", action: "enrollment.created", entity: "enrollment", detail: `Inscripción creada con ${enrollment.installments} cuotas`, createdAt: new Date().toISOString() }, ...current.audit]
      }));
      return enrollment;
    },
    addPayment(input) {
      const payment: Payment = { ...input, id: `payment-${crypto.randomUUID()}`, reference: `REC-2026-${String(state.payments.length + 1).padStart(5, "0")}`, registeredAt: new Date().toISOString() };
      setState((current) => ({
        ...current,
        payments: [payment, ...current.payments],
        charges: payment.status === "confirmed" ? reconcileCharge(current.charges, payment.allocationChargeId, payment.amountCents) : current.charges,
        audit: [{ id: crypto.randomUUID(), workspaceId: payment.workspaceId, actor: "Usuario demo", action: "payment.created", entity: "payment", detail: `${payment.reference} registrado`, createdAt: new Date().toISOString() }, ...current.audit]
      }));
      return payment;
    },
    updateStudent(id, patch) { setState((current) => ({ ...current, students: current.students.map((item) => item.id === id ? { ...item, ...patch } : item), audit: [{ id: crypto.randomUUID(), workspaceId: current.students.find((s) => s.id === id)?.workspaceId ?? "ws-fusion", actor: "Usuario demo", action: "student.updated", entity: "student", detail: `Legajo ${id} actualizado`, createdAt: new Date().toISOString() }, ...current.audit] })); },
    regenerateQr(id) { setState((current) => ({ ...current, students: current.students.map((item) => item.id === id ? { ...item, qrCode: `ACA-${crypto.randomUUID().slice(0, 10).toUpperCase()}` } : item), audit: [{ id: crypto.randomUUID(), workspaceId: current.students.find((s) => s.id === id)?.workspaceId ?? "ws-fusion", actor: "Usuario demo", action: "student.qr_regenerated", entity: "student", detail: `Credencial QR regenerada para ${id}`, createdAt: new Date().toISOString() }, ...current.audit] })); },
    updatePayment(id, status) {
      setState((current) => {
        const payment = current.payments.find((item) => item.id === id);
        let charges = current.charges;
        if (payment && payment.allocationChargeId) {
          if (status === "confirmed" && payment.status !== "confirmed") charges = reconcileCharge(charges, payment.allocationChargeId, payment.amountCents);
          if (status === "reversed" && payment.status === "confirmed") charges = reconcileCharge(charges, payment.allocationChargeId, -payment.amountCents);
        }
        return {
          ...current,
          payments: current.payments.map((item) => item.id === id ? { ...item, status } : item),
          charges,
          audit: [{ id: crypto.randomUUID(), workspaceId: "ws-fusion", actor: "Martina Ríos", action: `payment.${status}`, entity: "payment", detail: `Pago ${id} cambió a ${status}`, createdAt: new Date().toISOString() }, ...current.audit]
        };
      });
    },
    assignPayment(paymentId, chargeId) {
      setState((current) => {
        const payment = current.payments.find((item) => item.id === paymentId);
        if (!payment || payment.allocationChargeId) return current;
        const charges = payment.status === "confirmed" ? reconcileCharge(current.charges, chargeId, payment.amountCents) : current.charges;
        return {
          ...current,
          payments: current.payments.map((item) => item.id === paymentId ? { ...item, allocationChargeId: chargeId } : item),
          charges,
          audit: [{ id: crypto.randomUUID(), workspaceId: payment.workspaceId, actor: "Usuario demo", action: "payment.assigned", entity: "payment", detail: `${payment.reference} asignado a un cargo`, createdAt: new Date().toISOString() }, ...current.audit]
        };
      });
    },
    closeSettlements() {
      setState((current) => {
        const instructors = Array.from(new Set(current.cohorts.filter((item) => item.workspaceId === "ws-fusion").map((item) => item.instructor)));
        const rawLabel = new Date().toLocaleDateString("es-AR", { month: "long", year: "numeric" });
        const periodLabel = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
        const closedAt = new Date().toISOString();
        const closures = instructors
          .map((instructor) => {
            const lastClosure = current.settlements.filter((item) => item.instructor === instructor).sort((a, b) => b.closedAt.localeCompare(a.closedAt))[0];
            const { baseCents, commissionCents } = settlementBase(current, instructor, lastClosure?.closedAt);
            return { id: crypto.randomUUID(), workspaceId: "ws-fusion", instructor, periodLabel, baseCents, commissionCents, closedAt };
          })
          .filter((closure) => closure.baseCents > 0);
        if (closures.length === 0) return current;
        return {
          ...current,
          settlements: [...closures, ...current.settlements],
          audit: [{ id: crypto.randomUUID(), workspaceId: "ws-fusion", actor: "Usuario demo", action: "settlements.closed", entity: "settlement", detail: `Cierre de ${periodLabel} para ${closures.length} profesor(es)`, createdAt: closedAt }, ...current.audit]
        };
      });
    },
    addCheckin(input) { setState((current) => ({ ...current, checkins: [{ ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...current.checkins], audit: [{ id: crypto.randomUUID(), workspaceId: input.workspaceId, actor: "Carla Méndez", action: `checkin.${input.result}`, entity: "checkin", detail: input.reason, createdAt: new Date().toISOString() }, ...current.audit] })); },
    updateRequest(id, status) { setState((current) => ({ ...current, requests: current.requests.map((item) => item.id === id ? { ...item, status } : item) })); },
    updateAlert(id, status) { setState((current) => ({ ...current, alerts: current.alerts.map((item) => item.id === id ? { ...item, status } : item) })); },
    setAttendance(classId, studentId, status) {
      setState((current) => {
        const workspaceId = current.classes.find((item) => item.id === classId)?.workspaceId ?? "ws-fusion";
        const exists = current.attendance.some((item) => item.classId === classId && item.studentId === studentId);
        const attendance = exists
          ? current.attendance.map((item) => item.classId === classId && item.studentId === studentId ? { ...item, status, markedAt: new Date().toISOString() } : item)
          : [...current.attendance, { id: crypto.randomUUID(), workspaceId, classId, studentId, status, markedAt: new Date().toISOString() }];
        return { ...current, attendance };
      });
    },
    closeAttendance(classId) {
      setState((current) => ({
        ...current,
        classes: current.classes.map((item) => item.id === classId ? { ...item, attendanceClosed: true, status: "completed" } : item),
        audit: [{ id: crypto.randomUUID(), workspaceId: current.classes.find((item) => item.id === classId)?.workspaceId ?? "ws-fusion", actor: "Usuario demo", action: "attendance.closed", entity: "class", detail: `Asistencia cerrada para la clase ${classId}`, createdAt: new Date().toISOString() }, ...current.audit]
      }));
    },
    addCourse(input) {
      const code = codeFromName(input.name, state.courses.map((item) => item.code));
      const course: Course = { ...input, id: `course-local-${crypto.randomUUID()}`, code };
      setState((current) => ({ ...current, courses: [course, ...current.courses], audit: [{ id: crypto.randomUUID(), workspaceId: course.workspaceId, actor: "Usuario demo", action: "course.created", entity: "course", detail: `${course.name} fue dado de alta`, createdAt: new Date().toISOString() }, ...current.audit] }));
      return course;
    },
    addClass(input) {
      const session: ClassSession = { ...input, id: `class-local-${crypto.randomUUID()}`, attendanceClosed: false };
      setState((current) => ({ ...current, classes: [...current.classes, session], audit: [{ id: crypto.randomUUID(), workspaceId: session.workspaceId, actor: "Usuario demo", action: "class.created", entity: "class", detail: `Clase adicional agregada para ${session.date}`, createdAt: new Date().toISOString() }, ...current.audit] }));
      return session;
    },
    // Sin esto, crear una comisión no dejaba ninguna clase agendada: había
    // que agregarlas una por una a mano desde "Clase adicional".
    addClassesForCohort(input) {
      const weekdayIndex: Record<string, number> = { "Domingo": 0, "Lunes": 1, "Martes": 2, "Miércoles": 3, "Jueves": 4, "Viernes": 5, "Sábado": 6 };
      const targetDays = input.weekdays.map((day) => weekdayIndex[day]).filter((day): day is number => day !== undefined);
      const [startHour = 0, startMinute = 0] = input.startsAt.split(":").map(Number);
      const endTotalMinutes = (startHour * 60 + startMinute + 120) % (24 * 60);
      const endsAt = `${String(Math.floor(endTotalMinutes / 60)).padStart(2, "0")}:${String(endTotalMinutes % 60).padStart(2, "0")}`;
      const start = new Date();
      const end = new Date(start.getTime() + input.durationMonths * 30 * 86_400_000);
      const sessions: ClassSession[] = [];
      for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
        if (targetDays.includes(day.getDay())) sessions.push({ id: `class-local-${crypto.randomUUID()}`, workspaceId: input.workspaceId, cohortId: input.cohortId, date: day.toISOString().slice(0, 10), startsAt: input.startsAt, endsAt, status: "scheduled", attendanceClosed: false });
      }
      setState((current) => ({
        ...current,
        classes: [...current.classes, ...sessions],
        audit: [{ id: crypto.randomUUID(), workspaceId: input.workspaceId, actor: "Usuario demo", action: "class.bulk_created", entity: "class", detail: `${sessions.length} clases generadas para la comisión ${input.cohortId}`, createdAt: new Date().toISOString() }, ...current.audit]
      }));
      return sessions.length;
    },
    readNotifications() { setState((current) => ({ ...current, notificationsRead: true })); },
    createWorkspace(input) {
      const base = `ws-${input.name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "cliente"}`;
      const existingIds = state.workspaces.map((item) => item.id);
      let id = base;
      let suffix = 2;
      while (existingIds.includes(id)) { id = `${base}-${suffix}`; suffix += 1; }
      const workspace: Workspace = { id, name: input.name, plan: input.plan, status: "trial", academies: 0, users: 0, students: 0, nextReview: input.nextReview, billingNote: "Cliente nuevo. Sin revisión comercial todavía." };
      setState((current) => ({
        ...current,
        workspaces: [...current.workspaces, workspace],
        audit: [{ id: crypto.randomUUID(), actor: "Admin Plataforma", action: "workspace.created", entity: "workspace", detail: `${workspace.name} (${workspace.id}) fue dado de alta`, createdAt: new Date().toISOString() }, ...current.audit]
      }));
      return workspace;
    },
    updateWorkspace(id, patch) {
      setState((current) => ({
        ...current,
        workspaces: current.workspaces.map((item) => item.id === id ? { ...item, ...patch } : item),
        audit: [{ id: crypto.randomUUID(), actor: "Admin Plataforma", action: "workspace.updated", entity: "workspace", detail: `Estado de servicio actualizado para ${id}`, createdAt: new Date().toISOString() }, ...current.audit]
      }));
    },
    suspendWorkspace(id, reason) {
      setState((current) => ({
        ...current,
        workspaces: current.workspaces.map((item) => item.id === id ? { ...item, status: "suspended" } : item),
        audit: [{ id: crypto.randomUUID(), actor: "Admin Plataforma", action: "workspace.suspended", entity: "workspace", detail: `${id} suspendido · Motivo: ${reason}`, createdAt: new Date().toISOString() }, ...current.audit]
      }));
    },
    reactivateWorkspace(id) {
      setState((current) => ({
        ...current,
        workspaces: current.workspaces.map((item) => item.id === id ? { ...item, status: "active" } : item),
        audit: [{ id: crypto.randomUUID(), actor: "Admin Plataforma", action: "workspace.reactivated", entity: "workspace", detail: `${id} reactivado`, createdAt: new Date().toISOString() }, ...current.audit]
      }));
    },
    enterSupport(id, reason) {
      setState((current) => ({
        ...current,
        audit: [{ id: crypto.randomUUID(), actor: "Admin Plataforma", action: "support.entered", entity: "workspace", detail: `Sesión de soporte iniciada en ${id} · Motivo: ${reason}`, createdAt: new Date().toISOString() }, ...current.audit]
      }));
      return;
    },
    inviteUser(input) {
      const user: PlatformUser = { ...input, id: `user-${crypto.randomUUID()}`, status: "invited", lastAccess: "Nunca" };
      setState((current) => ({
        ...current,
        users: [user, ...current.users],
        audit: [{ id: crypto.randomUUID(), actor: "Admin Plataforma", action: "user.invited", entity: "user", detail: `${user.email} invitado como ${user.role}`, createdAt: new Date().toISOString() }, ...current.audit]
      }));
      return user;
    },
    reset() { localStorage.removeItem(storageKey); setState(initialDemoState); }
  }), [state]);

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error("useDemo debe utilizarse dentro de DemoProvider");
  return value;
}
