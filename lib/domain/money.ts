export function formatMoney(cents: number, locale = "es-AR", currency = "ARS") {
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);
}

export function applyDiscount(cents: number, type: "fixed" | "percent", value: number) {
  const discount = type === "fixed" ? value : Math.round((cents * value) / 10_000);
  return Math.max(0, cents - discount);
}

export function commissionAmount(eligibleCents: number, basisPoints: number) {
  if (!Number.isInteger(eligibleCents) || eligibleCents < 0) throw new Error("El importe debe ser un entero no negativo");
  if (!Number.isInteger(basisPoints) || basisPoints < 0 || basisPoints > 10_000) throw new Error("Porcentaje fuera de rango");
  return Math.round((eligibleCents * basisPoints) / 10_000);
}

export function chargeStatus(amountCents: number, paidCents: number, dueDate: string, now = new Date()) {
  if (paidCents >= amountCents) return "paid" as const;
  if (paidCents > 0) return "partial" as const;
  if (new Date(`${dueDate}T23:59:59`).getTime() < now.getTime()) return "overdue" as const;
  return "pending" as const;
}
