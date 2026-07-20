import type { Role } from "@/lib/domain/types";

const capabilities = {
  platform_superadmin: ["platform:manage", "support:enter", "audit:global"],
  owner: ["academy:manage", "student:manage", "payment:manage", "settlement:close", "audit:workspace"],
  receptionist: ["student:manage", "enrollment:create", "payment:create", "cash:manage", "checkin:create"],
  instructor: ["roster:view", "attendance:manage", "settlement:view"]
} satisfies Record<Role, string[]>;

export function can(role: Role, capability: string) {
  return capabilities[role].includes(capability);
}

export function evaluateQr(input: {
  validToken: boolean;
  activeStudent: boolean;
  activeEnrollment: boolean;
  hasCompatibleClass: boolean;
  overdue: boolean;
  hasConfirmedPayment: boolean;
  policy: "inform_only" | "allow_with_warning" | "block_if_overdue" | "block_if_no_confirmed_payment" | "manual_review";
}) {
  if (!input.validToken) return { result: "denied" as const, reason: "QR inválido o revocado" };
  if (!input.activeStudent) return { result: "denied" as const, reason: "Alumno inactivo o bloqueado" };
  if (!input.activeEnrollment) return { result: "denied" as const, reason: "Sin inscripción oficial vigente" };
  if (!input.hasCompatibleClass) return { result: "denied" as const, reason: "No hay una clase compatible en esta ventana" };
  if (input.policy === "block_if_overdue" && input.overdue) return { result: "denied" as const, reason: "Acceso bloqueado por deuda vencida" };
  if (input.policy === "block_if_no_confirmed_payment" && !input.hasConfirmedPayment) return { result: "denied" as const, reason: "No existe un pago confirmado" };
  if (input.policy === "manual_review") return { result: "warning" as const, reason: "Requiere autorización manual" };
  if (input.overdue) return { result: "warning" as const, reason: "Autorizado con deuda pendiente" };
  return { result: "authorized" as const, reason: "Inscripción y acceso vigentes" };
}

export function isAttendanceWindow(start: Date, end: Date, now: Date, beforeMinutes = 30, afterHours = 6) {
  return now.getTime() >= start.getTime() - beforeMinutes * 60_000 && now.getTime() <= end.getTime() + afterHours * 3_600_000;
}
