const messages: Record<string, { status: number; error: string }> = {
  CASH_ACCESS_DENIED: { status: 403, error: "No tenés permiso para operar la caja de esta sede." },
  CASH_ALREADY_OPEN: { status: 409, error: "Ya tenés una caja abierta en esta sede." },
  CASH_NOT_CLOSABLE: { status: 409, error: "Esta caja no se puede cerrar (ya está cerrada o no te pertenece)." },
  OPEN_CASH_REQUIRED: { status: 409, error: "Abrí la caja antes de registrar un cobro en efectivo." },
  PAYMENT_ACCESS_DENIED: { status: 403, error: "No tenés permiso para registrar pagos en esta academia." },
  INVALID_PAYMENT_AMOUNT: { status: 400, error: "El importe o la asignación del pago no son válidos." },
  CHARGE_NOT_PAYABLE: { status: 409, error: "Esa cuota ya no admite pagos (está pagada, anulada o exenta)." },
  ALLOCATION_EXCEEDS_BALANCE: { status: 409, error: "El importe supera el saldo pendiente de la cuota." },
  STUDENT_TENANT_MISMATCH: { status: 403, error: "El alumno no pertenece a este workspace." },
  ENROLLMENT_ACCESS_DENIED: { status: 403, error: "No tenés permiso para gestionar inscripciones en esta academia." },
  STUDENT_NOT_ELIGIBLE: { status: 409, error: "El alumno no está activo o no pertenece a esta academia." },
  COHORT_CAPACITY_REACHED: { status: 409, error: "La comisión alcanzó su cupo máximo." },
  ENROLLMENT_ALREADY_EXISTS: { status: 409, error: "Ya existe una inscripción con esos datos (evitá reenviar el formulario)." },
  INVALID_ENROLLMENT_VALUES: { status: 400, error: "El precio acordado o la cantidad de cuotas no son válidos." },
  PAYMENT_NOT_CONFIRMABLE: { status: 409, error: "Ese pago no está pendiente de validación." },
  ONLY_CONFIRMED_PAYMENT_CAN_BE_REVERSED: { status: 409, error: "Solo se puede revertir un pago confirmado." }
};

export function mapRpcError(message?: string | null): { status: number; error: string } {
  if (message) for (const [code, mapped] of Object.entries(messages)) if (message.includes(code)) return mapped;
  return { status: 500, error: "No se pudo completar la operación." };
}
