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
  ONLY_CONFIRMED_PAYMENT_CAN_BE_REVERSED: { status: 409, error: "Solo se puede revertir un pago confirmado." },
  AUTHENTICATION_REQUIRED: { status: 401, error: "Tenés que iniciar sesión para hacer esto." },
  IDEMPOTENCY_KEY_REQUIRED: { status: 400, error: "Falta la clave de idempotencia de la operación." },
  COHORT_ACCESS_DENIED: { status: 403, error: "Solo la propietaria puede crear o editar comisiones." },
  INVALID_COHORT_DATES: { status: 400, error: "La fecha de fin estimada no puede ser anterior a la de inicio." },
  COHORT_DURATION_TOO_LONG: { status: 400, error: "La comisión no puede durar más de 3 años." },
  SCHEDULE_DAYS_REQUIRED: { status: 400, error: "Elegí al menos un día de cursada." },
  TOO_MANY_SCHEDULE_DAYS: { status: 400, error: "No se pueden cargar más de 7 días de cursada." },
  COHORT_NAME_REQUIRED: { status: 400, error: "El nombre de la comisión es obligatorio." },
  INVALID_SCHEDULE_DAY: { status: 400, error: "Uno de los horarios de cursada no es válido." },
  DUPLICATE_SCHEDULE_WEEKDAY: { status: 400, error: "No se puede repetir el mismo día de cursada." },
  BRANCH_TENANT_MISMATCH: { status: 400, error: "La sede elegida no pertenece a esta academia." },
  COURSE_TENANT_MISMATCH: { status: 400, error: "El curso elegido no pertenece a esta academia." },
  INSTRUCTOR_NOT_ELIGIBLE: { status: 400, error: "El profesor elegido no está activo en esta academia." },
  COHORT_CODE_ALREADY_EXISTS: { status: 409, error: "Ya existe una comisión con ese código, reintentá." },
  IDEMPOTENCY_KEY_PAYLOAD_MISMATCH: { status: 409, error: "Esta operación ya se envió antes con datos distintos." },
  COHORT_CREATE_CONFLICT: { status: 409, error: "No se pudo crear la comisión, reintentá." },
  COHORT_SCHEDULE_TENANT_MISMATCH: { status: 400, error: "El horario no corresponde a la sede o academia de la comisión." },
  CHARGES_SUMMARY_ACCESS_DENIED: { status: 403, error: "No tenés permiso para ver los vencimientos de esta academia." },
  ATTENDANCE_NOT_EDITABLE: { status: 409, error: "Esta clase ya no admite cambios de asistencia (está cerrada o no tenés acceso)." },
  ENROLLMENT_NOT_ELIGIBLE: { status: 400, error: "Ese alumno no tiene una inscripción vigente en esta comisión." },
  ATTENDANCE_ACCESS_DENIED: { status: 403, error: "No tenés permiso para cerrar la asistencia de esta clase." }
};

export function mapRpcError(message?: string | null): { status: number; error: string } {
  if (message) for (const [code, mapped] of Object.entries(messages)) if (message.includes(code)) return mapped;
  return { status: 500, error: "No se pudo completar la operación." };
}
