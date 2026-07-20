import type { Cohort, DemoState, Enrollment, Student } from "@/lib/domain/types";

const firstNames = ["Valentina", "Mateo", "Sofía", "Benjamín", "Camila", "Lautaro", "Martina", "Thiago", "Julieta", "Franco", "Lucía", "Santino"];
const lastNames = ["Gómez", "Fernández", "López", "Martínez", "Romero", "Díaz", "Sosa", "Álvarez", "Ruiz", "Torres"];

const legacyStudents: Student[] = Array.from({ length: 34 }, (_, index) => {
  const minor = index % 7 === 0;
  return {
    id: `student-${index + 1}`,
    publicCode: `ALU-${String(index + 1).padStart(4, "0")}`,
    workspaceId: index < 30 ? "ws-fusion" : "ws-norte",
    academyId: index < 18 ? "academy-fusion" : index < 30 ? "academy-imperio" : "academy-norte",
    firstName: firstNames[index % firstNames.length]!,
    lastName: lastNames[index % lastNames.length]!,
    dni: String(35_100_000 + index * 12_371),
    birthDate: minor ? `201${index % 8}-0${(index % 8) + 1}-12` : `199${index % 9}-0${(index % 8) + 1}-15`,
    phone: `+54 9 11 5555-${String(1000 + index)}`,
    email: index % 4 === 0 ? undefined : `alumno${index + 1}@demo.local`,
    status: index === 8 ? "blocked" : index === 16 ? "inactive" : "active",
    guardian: minor ? { name: `María ${lastNames[index % lastNames.length]}`, relationship: "Madre", phone: "+54 9 11 4444-2200" } : undefined,
    qrCode: `ACA-${String(index + 1).padStart(4, "0")}-${index < 30 ? "FUS" : "NOR"}`,
    createdAt: new Date(2026, index % 6, (index % 25) + 1).toISOString()
  };
});

const legacyEnrollments = legacyStudents.slice(0, 27).map((student, index) => ({
  id: `enrollment-${index + 1}`,
  workspaceId: student.workspaceId,
  studentId: student.id,
  cohortId: index < 8 ? "cohort-barber-1" : index < 16 ? "cohort-color-1" : index < 22 ? "cohort-barber-2" : "cohort-norte-1",
  status: (index === 11 ? "dropped_out" : index % 6 === 0 ? "overdue" : "attending") as "dropped_out" | "overdue" | "attending",
  agreedPriceCents: 420_000_00,
  installments: 6,
  enrolledAt: new Date(2026, 2, (index % 20) + 1).toISOString()
}));

const legacyCohorts: Cohort[] = [
  { id: "cohort-barber-1", workspaceId: "ws-fusion", academyId: "academy-fusion", branchId: "branch-centro", code: "BAR-26-A", name: "Barbería Inicial A", course: "Barbería profesional", instructor: "Tomás Herrera", schedule: "Lunes y miércoles · 18:00", capacity: 8, enrolled: 8, installmentCents: 70_000_00, installments: 6, durationMonths: 6, commissionBps: 4000, debtPolicy: "allow_with_warning", status: "active" },
  { id: "cohort-color-1", workspaceId: "ws-fusion", academyId: "academy-fusion", branchId: "branch-norte", code: "COL-26-B", name: "Colorimetría B", course: "Colorimetría aplicada", instructor: "Luciana Paz", schedule: "Martes · 10:00", capacity: 12, enrolled: 8, installmentCents: 85_000_00, installments: 4, durationMonths: 4, commissionBps: 3500, debtPolicy: "block_if_overdue", status: "active" },
  { id: "cohort-barber-2", workspaceId: "ws-fusion", academyId: "academy-imperio", branchId: "branch-imperio", code: "BAR-26-C", name: "Barbería avanzada", course: "Barbería profesional", instructor: "Diego Luna", schedule: "Sábados · 09:00", capacity: 10, enrolled: 6, installmentCents: 92_000_00, installments: 6, durationMonths: 6, commissionBps: 4200, debtPolicy: "inform_only", status: "active" },
  { id: "cohort-style-1", workspaceId: "ws-fusion", academyId: "academy-fusion", branchId: "branch-centro", code: "STY-26-D", name: "Styling intensivo", course: "Styling", instructor: "Tomás Herrera", schedule: "Viernes · 16:00", capacity: 8, enrolled: 5, installmentCents: 60_000_00, installments: 2, durationMonths: 2, commissionBps: 4000, debtPolicy: "manual_review", status: "scheduled" },
  { id: "cohort-admin-1", workspaceId: "ws-fusion", academyId: "academy-imperio", branchId: "branch-imperio", code: "ADM-26-E", name: "Gestión de salón", course: "Gestión", instructor: "Luciana Paz", schedule: "Jueves · 19:00", capacity: 16, enrolled: 7, installmentCents: 55_000_00, installments: 3, durationMonths: 3, commissionBps: 3000, debtPolicy: "allow_with_warning", status: "active" },
  { id: "cohort-norte-1", workspaceId: "ws-norte", academyId: "academy-norte", branchId: "branch-norte-2", code: "NOR-26-A", name: "Corte Inicial", course: "Corte", instructor: "Iván Quiroga", schedule: "Lunes · 17:00", capacity: 8, enrolled: 4, installmentCents: 64_000_00, installments: 6, durationMonths: 6, commissionBps: 3800, debtPolicy: "allow_with_warning", status: "active" }
];

// Catálogo de cursos reutilizado tanto para el estado (Cursos) como para
// generar comisiones adicionales por profesor con precios coherentes por rubro.
const courseCatalog = [
  { id: "course-barber", name: "Barbería profesional", code: "BAR", duration: "6 meses", durationMonths: 6, priceCents: 420_000_00, installmentCents: 70_000_00 },
  { id: "course-color", name: "Colorimetría aplicada", code: "COL", duration: "4 meses", durationMonths: 4, priceCents: 340_000_00, installmentCents: 85_000_00 },
  { id: "course-gestion", name: "Gestión de salón", code: "GES", duration: "3 meses", durationMonths: 3, priceCents: 220_000_00, installmentCents: 55_000_00 },
  { id: "course-styling", name: "Styling", code: "STY", duration: "2 meses", durationMonths: 2, priceCents: 180_000_00, installmentCents: 60_000_00 },
  { id: "course-manicura", name: "Manicura y uñas", code: "MAN", duration: "2 meses", durationMonths: 2, priceCents: 160_000_00, installmentCents: 45_000_00 },
  { id: "course-maquillaje", name: "Maquillaje profesional", code: "MAQ", duration: "3 meses", durationMonths: 3, priceCents: 300_000_00, installmentCents: 65_000_00 },
  { id: "course-depilacion", name: "Depilación y cuidado facial", code: "DEP", duration: "2 meses", durationMonths: 2, priceCents: 190_000_00, installmentCents: 50_000_00 }
];
function courseFor(id: string) { return courseCatalog.find((item) => item.id === id)!; }

const weekdays = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const times = ["09:00", "10:00", "11:00", "16:00", "17:00", "18:00", "19:00"];
const capacities = [8, 10, 12, 16];
const debtPolicies: Cohort["debtPolicy"][] = ["allow_with_warning", "block_if_overdue", "inform_only", "manual_review", "block_if_no_confirmed_payment"];
const cohortStatuses: Cohort["status"][] = ["active", "active", "active", "active", "scheduled", "paused"];

// Cada profesor existente suma comisiones adicionales y se incorporan tres
// profesores nuevos, para reflejar una planta docente de 6 personas con
// 5 a 10 comisiones cada una (hoy sólo había 3 profesores con 1-2 comisiones).
const extraInstructorPlan: Array<{ instructor: string; branchId: string; academyId: string; courseIds: string[]; count: number }> = [
  { instructor: "Tomás Herrera", branchId: "branch-centro", academyId: "academy-fusion", courseIds: ["course-barber", "course-styling"], count: 5 },
  { instructor: "Luciana Paz", branchId: "branch-norte", academyId: "academy-fusion", courseIds: ["course-color", "course-gestion"], count: 5 },
  { instructor: "Diego Luna", branchId: "branch-imperio", academyId: "academy-imperio", courseIds: ["course-barber", "course-styling"], count: 5 },
  { instructor: "Valeria Sosa", branchId: "branch-centro", academyId: "academy-fusion", courseIds: ["course-manicura"], count: 6 },
  { instructor: "Martín Cabrera", branchId: "branch-norte", academyId: "academy-fusion", courseIds: ["course-maquillaje"], count: 6 },
  { instructor: "Agustina Rey", branchId: "branch-imperio", academyId: "academy-imperio", courseIds: ["course-depilacion"], count: 6 }
];

const extraCohorts: Cohort[] = [];
const extraStudents: Student[] = [];
const extraEnrollments: Enrollment[] = [];

let cohortSeq = 0;
let studentSeq = legacyStudents.length;

for (const plan of extraInstructorPlan) {
  for (let i = 0; i < plan.count; i += 1) {
    cohortSeq += 1;
    const course = courseFor(plan.courseIds[i % plan.courseIds.length]!);
    const capacity = capacities[cohortSeq % capacities.length]!;
    const enrolled = Math.max(4, capacity - (i % 3) * 2);
    const cohortInstallments = [2, 3, 4, 6][cohortSeq % 4]!;
    const cohortId = `cohort-extra-${cohortSeq}`;
    extraCohorts.push({
      id: cohortId,
      workspaceId: "ws-fusion",
      academyId: plan.academyId,
      branchId: plan.branchId,
      code: `${course.code}-26-${String(cohortSeq + 10).padStart(2, "0")}`,
      name: `${course.name} · Grupo ${String.fromCharCode(65 + (i % 6))}`,
      course: course.name,
      instructor: plan.instructor,
      schedule: `${weekdays[cohortSeq % weekdays.length]} · ${times[cohortSeq % times.length]}`,
      capacity,
      enrolled,
      installmentCents: course.installmentCents,
      installments: cohortInstallments,
      durationMonths: course.durationMonths,
      commissionBps: 3000 + (cohortSeq % 5) * 300,
      debtPolicy: debtPolicies[cohortSeq % debtPolicies.length]!,
      status: cohortStatuses[cohortSeq % cohortStatuses.length]!
    });

    for (let seat = 0; seat < enrolled; seat += 1) {
      studentSeq += 1;
      const nameIndex = studentSeq - 1;
      const student: Student = {
        id: `student-${studentSeq}`,
        publicCode: `ALU-${String(studentSeq).padStart(4, "0")}`,
        workspaceId: "ws-fusion",
        academyId: plan.academyId,
        firstName: firstNames[nameIndex % firstNames.length]!,
        lastName: lastNames[nameIndex % lastNames.length]!,
        dni: String(35_100_000 + nameIndex * 12_371),
        birthDate: `199${nameIndex % 9}-0${(nameIndex % 8) + 1}-15`,
        phone: `+54 9 11 5555-${String(1000 + nameIndex)}`,
        email: nameIndex % 4 === 0 ? undefined : `alumno${studentSeq}@demo.local`,
        status: "active",
        qrCode: `ACA-${String(studentSeq).padStart(4, "0")}-FUS`,
        createdAt: new Date(2026, nameIndex % 6, (nameIndex % 25) + 1).toISOString()
      };
      extraStudents.push(student);
      extraEnrollments.push({
        id: `enrollment-extra-${cohortId}-${seat + 1}`,
        workspaceId: "ws-fusion",
        studentId: student.id,
        cohortId,
        status: (seat % 9 === 0 ? "overdue" : seat % 13 === 0 ? "dropped_out" : "attending") as "overdue" | "dropped_out" | "attending",
        agreedPriceCents: course.installmentCents * cohortInstallments,
        installments: cohortInstallments,
        enrolledAt: new Date(2026, 2, (studentSeq % 20) + 1).toISOString()
      });
    }
  }
}

const students: Student[] = [...legacyStudents, ...extraStudents];
const cohorts: Cohort[] = [...legacyCohorts, ...extraCohorts];
const enrollments: Enrollment[] = [...legacyEnrollments, ...extraEnrollments];

const charges = enrollments.flatMap((enrollment, enrollmentIndex) =>
  Array.from({ length: 3 }, (_, chargeIndex) => {
    const paid = chargeIndex === 0 || enrollmentIndex % 4 !== 0;
    const partial = !paid && enrollmentIndex % 3 === 0;
    return {
      id: `charge-${enrollmentIndex + 1}-${chargeIndex + 1}`,
      workspaceId: enrollment.workspaceId,
      studentId: enrollment.studentId,
      enrollmentId: enrollment.id,
      concept: `Cuota ${chargeIndex + 1}/6`,
      amountCents: 70_000_00,
      paidCents: paid ? 70_000_00 : partial ? 25_000_00 : 0,
      dueDate: `2026-${String(chargeIndex + 5).padStart(2, "0")}-10`,
      status: (paid ? "paid" : partial ? "partial" : chargeIndex === 1 ? "overdue" : "pending") as "paid" | "partial" | "overdue" | "pending",
      commissionable: true
    };
  })
);

// Fecha fija (no Date.now()/new Date()) para que el seed sea idéntico en cada
// evaluación del módulo: el server lo importa una vez por proceso y el
// cliente lo re-evalúa al cargar el bundle, en momentos distintos. Usar la
// hora real acá produce un mismatch de hidratación de React intermitente.
const now = new Date(2026, 6, 12, 9, 30, 0);
const today = now.toISOString().slice(0, 10);

const classAttendance = [
  ...enrollments.filter((e) => e.cohortId === "cohort-color-1" && e.status !== "dropped_out").map((e, i) => ({ id: `attendance-${e.id}-today2`, workspaceId: e.workspaceId, classId: "class-today-2", studentId: e.studentId, status: (i % 5 === 0 ? "absent" : i % 4 === 0 ? "late" : "present") as "present" | "late" | "absent", markedAt: now.toISOString() })),
  ...enrollments.filter((e) => e.cohortId === "cohort-barber-1" && e.status !== "dropped_out").slice(0, 2).map((e) => ({ id: `attendance-${e.id}-today1`, workspaceId: e.workspaceId, classId: "class-today-1", studentId: e.studentId, status: "present" as const, markedAt: now.toISOString() }))
];

export const initialDemoState: DemoState = {
  students,
  courses: courseCatalog.map((course) => ({ id: course.id, workspaceId: "ws-fusion", name: course.name, code: course.code, duration: course.duration, durationMonths: course.durationMonths, priceCents: course.priceCents })),
  cohorts,
  enrollments,
  charges,
  payments: charges.filter((charge) => charge.paidCents > 0).slice(0, 24).map((charge, index) => ({ id: `payment-${index + 1}`, workspaceId: charge.workspaceId, studentId: charge.studentId, amountCents: charge.paidCents, method: index % 4 === 0 ? "bank_transfer" : index % 3 === 0 ? "mercado_pago" : "cash", status: index === 7 ? "reversed" : index === 10 ? "pending_validation" : "confirmed", reference: `REC-2026-${String(index + 1).padStart(5, "0")}`, registeredAt: new Date(2026, 6, (index % 10) + 1, 10 + (index % 8)).toISOString(), allocationChargeId: charge.id })),
  classes: [
    { id: "class-today-1", workspaceId: "ws-fusion", cohortId: "cohort-barber-1", date: today, startsAt: "18:00", endsAt: "20:00", status: "open", attendanceClosed: false },
    { id: "class-today-2", workspaceId: "ws-fusion", cohortId: "cohort-color-1", date: today, startsAt: "10:00", endsAt: "12:00", status: "completed", attendanceClosed: true },
    { id: "class-next", workspaceId: "ws-fusion", cohortId: "cohort-style-1", date: new Date(now.getTime() + 86_400_000).toISOString().slice(0, 10), startsAt: "16:00", endsAt: "18:00", status: "scheduled", attendanceClosed: false }
  ],
  attendance: classAttendance,
  checkins: [
    { id: "checkin-1", workspaceId: "ws-fusion", studentId: "student-1", classId: "class-today-1", result: "authorized", reason: "Inscripción y acceso vigentes", createdAt: now.toISOString() },
    { id: "checkin-2", workspaceId: "ws-fusion", studentId: "student-5", classId: "class-today-1", result: "warning", reason: "Autorizado con deuda pendiente", createdAt: now.toISOString() },
    { id: "checkin-3", workspaceId: "ws-fusion", studentId: "student-9", result: "denied", reason: "Alumno bloqueado", createdAt: now.toISOString() }
  ],
  requests: [
    { id: "request-1", workspaceId: "ws-fusion", type: "capacity_override", requester: "Carla Méndez", reason: "Agregar un alumno a BAR-26-A por traslado", status: "pending", createdAt: now.toISOString() },
    { id: "request-2", workspaceId: "ws-fusion", type: "attendance_correction", requester: "Tomás Herrera", reason: "Corregir ausencia justificada de Valentina", status: "pending", createdAt: now.toISOString() }
  ],
  alerts: [
    { id: "alert-1", workspaceId: "ws-fusion", severity: "high", title: "Intento de acceso sin inscripción", detail: "QR presentado en Sede Centro sin comisión vigente.", status: "new", createdAt: now.toISOString() },
    { id: "alert-2", workspaceId: "ws-fusion", severity: "medium", title: "Comisión sin vacantes", detail: "Barbería Inicial A alcanzó el cupo de 8 alumnos.", status: "under_review", createdAt: now.toISOString() },
    { id: "alert-3", workspaceId: "ws-fusion", severity: "low", title: "Transferencia por validar", detail: "Existe un pago pendiente de confirmación.", status: "new", createdAt: now.toISOString() }
  ],
  settlements: [
    { id: "settlement-1", workspaceId: "ws-fusion", instructor: "Tomás Herrera", periodLabel: "Junio 2026", baseCents: 1_680_000_00, commissionCents: 672_000_00, closedAt: new Date(2026, 5, 30, 18, 0, 0).toISOString() }
  ],
  audit: [
    { id: "audit-1", workspaceId: "ws-fusion", actor: "Carla Méndez", action: "payment.confirmed", entity: "payment", detail: "Pago REC-2026-00024 confirmado", createdAt: now.toISOString() },
    { id: "audit-2", workspaceId: "ws-fusion", actor: "Sistema", action: "checkin.denied", entity: "checkin", detail: "Acceso denegado y alerta generada", createdAt: now.toISOString() },
    { id: "audit-3", actor: "Admin Plataforma", action: "workspace.reviewed", entity: "workspace", detail: "Revisión operativa de Academia Fusión", createdAt: now.toISOString() }
  ],
  workspaces: [
    { id: "ws-fusion", name: "Grupo Fusión", plan: "Profesional", status: "active", academies: 2, users: 7, students: students.filter((s) => s.workspaceId === "ws-fusion").length, nextReview: "2026-08-01", billingNote: "Cuenta al día. Revisión comercial mensual." },
    { id: "ws-norte", name: "Academia Norte", plan: "Inicial", status: "active", academies: 1, users: 3, students: 4, nextReview: "2026-07-25", billingNote: "Cuenta al día." },
    { id: "ws-trial", name: "Demo Patagonia", plan: "Prueba", status: "trial", academies: 1, users: 2, students: 0, nextReview: "2026-07-20", billingNote: "En período de prueba." },
    { id: "ws-paused", name: "Estudio Sur", plan: "Inicial", status: "suspended", academies: 1, users: 4, students: 18, nextReview: "2026-07-15", billingNote: "Suspendida por falta de pago." }
  ],
  users: [
    { id: "user-owner", workspaceId: "ws-fusion", name: "Martina Ríos", email: "owner@demo.local", role: "Propietaria", scope: "Todas las academias", status: "active", lastAccess: "Hoy 08:31" },
    { id: "user-reception", workspaceId: "ws-fusion", name: "Carla Méndez", email: "recepcion@demo.local", role: "Recepción", scope: "Fusión · Centro", status: "active", lastAccess: "Hoy 09:42" },
    { id: "user-instructor-1", workspaceId: "ws-fusion", name: "Tomás Herrera", email: "profesor@demo.local", role: "Profesor", scope: "2 comisiones", status: "active", lastAccess: "Ayer 21:04" },
    { id: "user-instructor-2", workspaceId: "ws-fusion", name: "Luciana Paz", email: "luciana@demo.local", role: "Profesor", scope: "2 comisiones", status: "active", lastAccess: "11/07 18:23" }
  ],
  notificationsRead: false
};
