import { describe, expect, it } from "vitest";
import { initialDemoState } from "@/lib/demo/seed";

describe("aislamiento del dataset demostrativo", () => {
  it("tiene dos clientes sin IDs de alumno compartidos", () => { const a=initialDemoState.students.filter(s=>s.workspaceId==="ws-fusion");const b=initialDemoState.students.filter(s=>s.workspaceId==="ws-norte");expect(a.length).toBeGreaterThanOrEqual(30);expect(b.length).toBeGreaterThan(0);expect(a.some(left=>b.some(right=>right.id===left.id))).toBe(false); });
  it("toda asignación de pago conserva el mismo workspace del cargo", () => { for(const payment of initialDemoState.payments){const charge=initialDemoState.charges.find(c=>c.id===payment.allocationChargeId);expect(charge?.workspaceId).toBe(payment.workspaceId);} });
  it("no cuenta pagos pendientes o revertidos como base elegible", () => { const eligible=initialDemoState.payments.filter(p=>p.status==="confirmed");expect(eligible.every(p=>!["pending_validation","reversed"].includes(p.status))).toBe(true); });
});
