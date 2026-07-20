import { describe, expect, it } from "vitest";
import { applyDiscount, chargeStatus, commissionAmount, formatMoney } from "@/lib/domain/money";

describe("reglas monetarias", () => {
  it("calcula comisión en centavos sin float persistido", () => { expect(commissionAmount(100_000_00, 4000)).toBe(40_000_00); });
  it("rechaza porcentajes fuera de rango", () => { expect(() => commissionAmount(100, 10_001)).toThrow("Porcentaje fuera de rango"); });
  it("aplica descuento fijo y porcentual en puntos básicos", () => { expect(applyDiscount(100_000, "fixed", 20_000)).toBe(80_000); expect(applyDiscount(100_000, "percent", 1500)).toBe(85_000); });
  it("nunca deja un importe negativo", () => { expect(applyDiscount(10_000, "fixed", 20_000)).toBe(0); });
  it("deriva el estado del cargo", () => { expect(chargeStatus(100, 100, "2020-01-01")).toBe("paid"); expect(chargeStatus(100, 50, "2020-01-01")).toBe("partial"); expect(chargeStatus(100, 0, "2020-01-01", new Date("2020-02-01"))).toBe("overdue"); });
  it("formatea ARS", () => { expect(formatMoney(100_000_00)).toContain("100.000"); });
});
