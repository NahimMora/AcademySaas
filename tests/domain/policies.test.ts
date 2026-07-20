import { describe, expect, it } from "vitest";
import { can, evaluateQr, isAttendanceWindow } from "@/lib/domain/policies";

const valid = { validToken: true, activeStudent: true, activeEnrollment: true, hasCompatibleClass: true, overdue: false, hasConfirmedPayment: true, policy: "allow_with_warning" as const };
describe("permisos y QR", () => {
  it("impide pagos y alumnos al profesor", () => { expect(can("instructor", "payment:create")).toBe(false); expect(can("instructor", "student:manage")).toBe(false); });
  it("permite caja y check-in a recepción", () => { expect(can("receptionist", "cash:manage")).toBe(true); expect(can("receptionist", "checkin:create")).toBe(true); });
  it("autoriza una credencial elegible", () => { expect(evaluateQr(valid).result).toBe("authorized"); });
  it("rechaza QR inválido y ausencia de inscripción", () => { expect(evaluateQr({ ...valid, validToken: false }).result).toBe("denied"); expect(evaluateQr({ ...valid, activeEnrollment: false }).reason).toContain("inscripción"); });
  it("aplica advertencia o bloqueo por deuda según política", () => { expect(evaluateQr({ ...valid, overdue: true }).result).toBe("warning"); expect(evaluateQr({ ...valid, overdue: true, policy: "block_if_overdue" }).result).toBe("denied"); });
  it("calcula ventana de asistencia", () => { const start=new Date("2026-07-12T18:00:00Z"),end=new Date("2026-07-12T20:00:00Z"); expect(isAttendanceWindow(start,end,new Date("2026-07-12T17:30:00Z"))).toBe(true); expect(isAttendanceWindow(start,end,new Date("2026-07-13T03:00:00Z"))).toBe(false); });
});
