# Checklist manual — Academia SaaS

> Complementa a Playwright (`tests/e2e/core-flow.spec.ts`), no lo reemplaza:
> el E2E automatizado cubre un camino feliz por rol; este checklist es para
> el pase manual en navegador real antes de un deploy real, con foco en
> responsive, casos borde y detalles visuales que un E2E no ejercita.
> Marcar `[x]` a medida que se verifica a mano; lo que quede `[ ]` no
> implica que esté roto, solo que no se confirmó en la última pasada.

## Cómo correrlo

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

Cuentas demo (clave `Demo-3300!`): `superadmin@demo.local`,
`owner@demo.local`, `recepcion@demo.local`, `profesor@demo.local`. Detalle
del recorrido en `docs/DEMO.md`.

Probar cada bloque en **375px** (mobile), **768px** (tablet) y desktop.

## Login y acceso

- [ ] Login con las 4 credenciales demo, cada una cae en la vista que le
  corresponde por rol (`/app/dashboard` owner/recepción, `/instructor/
  dashboard` profesor, `/platform` superadmin).
- [ ] `/forgot-password` → llega el mail (o revisar la outbox de dev si no
  hay SMTP real) → el link vuelve a `/reset-password` → la contraseña
  nueva funciona para loguearse.
- [ ] Recepción bloqueada en rutas que no están en su subset del nav
  (ej. `/app/settlements`, `/app/audit`, `/app/imports`) — probar por URL
  directa, no solo confiar en que el menú las oculta.
- [ ] Profesor bloqueado en módulos financieros de owner (`/app/payments`,
  `/app/cash`) → redirige a `/access-denied`.
- [ ] Superadmin entra a `/platform`, un owner normal no puede acceder ahí.

## Alumnos

- [ ] Alta de alumno nuevo (`/app/students`): nombre, apellido, DNI,
  fecha de nacimiento, teléfono — confirma legajo creado.
- [ ] DNI duplicado dentro del mismo workspace se rechaza con mensaje
  legible (constraint único).
- [ ] Búsqueda/filtro de alumnos funciona sin regresiones.
- [ ] Ficha de alumno muestra tutores cuando corresponde (menor de edad).
- [ ] Exportar listado de alumnos descarga un archivo real (no JSON crudo).

## Cursos, comisiones y clases

- [ ] Crear curso, agregar una comisión con cupo, confirmar que el cupo se
  respeta al inscribir.
- [ ] Asignar profesor a una comisión con porcentaje de liquidación.
- [ ] Clases: crear sesión de clase, queda visible para tomar asistencia.

## Inscripciones y cargos

- [ ] Inscribir un alumno en una comisión genera los cargos (cuotas)
  esperados según la configuración del curso.
- [ ] Intentar inscribir sobre una comisión sin cupo se rechaza (no permite
  sobrecupo por carrera — dos inscripciones simultáneas al último lugar no
  deberían duplicar el cupo).
- [ ] Abandono (`drop_enrollment`): registrar baja con fecha efectiva y
  motivo, confirma que los cargos futuros no vencidos se ajustan.

## Pagos y caja

- [ ] Registrar un pago manual (`/app/payments`), confirma estado
  `confirmado` y que el cargo asociado pasa a pagado/parcial según
  corresponda.
- [ ] Pago parcial: registrar menos del total del cargo, confirma que
  queda `parcial` y el saldo pendiente es correcto.
- [ ] Reversión de un pago (`reverse_payment`): revierte la asignación al
  cargo, motivo obligatorio, queda en `audit_logs` (ver `/app/audit`).
- [ ] Abrir caja con monto inicial, registrar movimientos, cerrar con una
  diferencia entre lo esperado y lo contado — no bloquea el cierre.
- [ ] Las tarjetas de dinero no se rompen en 375px/768px.
- [ ] Recibo/comprobante interno de un pago se genera y es legible.

## Check-in QR / Asistencia

- [ ] Emitir QR para un alumno, escanear (o cámara simulada), confirma
  resultado verde/amarillo/rojo según el estado real de la inscripción.
- [ ] Revocar un QR emitido, confirma que un intento posterior con ese QR
  ya no autoriza el acceso.
- [ ] Tomar asistencia de una nómina cerrada (`save_attendance`) para una
  clase, confirma que queda reflejada en el resumen del profesor.
- [ ] Cerrar asistencia de una sesión (`close_attendance`) y confirmar que
  ediciones posteriores requieren una solicitud de corrección, no edición
  directa.
- [ ] Ventana de auto-registro del profesor: marcar su propia asistencia
  dentro y fuera de la ventana permitida, confirma que fuera de ventana se
  bloquea o requiere aprobación.

## Solicitudes y alertas

- [ ] Una solicitud de corrección pendiente aparece con badge en el nav
  (`/app/requests`).
- [ ] Resolver una solicitud (aprobar/rechazar con comentario) la saca de
  pendientes y queda auditada.
- [ ] Alertas (`/app/alerts`) muestra el badge correcto y el listado
  coincide con incidentes reales (mora, cupo, etc.).

## Liquidaciones docentes

- [ ] Estimación de comisión (`calculate_commission_estimate`) para un
  período muestra base comisionable coherente con los pagos confirmados
  del período (no cuenta pagos revertidos/pendientes).
- [ ] Cerrar liquidación (`close_instructor_settlement`) pide confirmación
  explícita, snapshot no se recalcula después aunque cambien los pagos
  base.
- [ ] Registrar pago al profesor (`register_instructor_payout`), reintentar
  la misma acción no duplica el pago (idempotencia).
- [ ] Vista del profesor (`/instructor/settlements`) solo muestra sus
  propias liquidaciones, no las de otros profesores.

## Auditoría

- [ ] `/app/audit` lista las acciones sensibles recientes (pago revertido,
  caja cerrada, liquidación cerrada, solicitud resuelta) con actor y detalle.
- [ ] `/platform/audit` (superadmin) muestra actividad cross-workspace,
  incluyendo accesos de soporte auditado.
- [ ] Ningún rol de aplicación puede editar o borrar una fila de
  `audit_logs` desde la UI (verificar que no hay acción de edición
  expuesta, coherente con `docs/SECURITY.md`).

## Informes e importaciones

- [ ] Exportar un informe en CSV, XLSX y PDF — cada uno abre correctamente
  en una herramienta real (no solo `200` de la API).
- [ ] Resumen mensual se genera con datos del período correcto.
- [ ] Importación: subir una planilla de ejemplo, revisar el preview de
  validación antes de confirmar el lote, confirmar que un error de fila
  puntual no aborta todo el lote silenciosamente.

## General

- [ ] Sin errores en la consola del navegador en ninguna pantalla recorrida.
- [ ] Navegación por teclado en los diálogos/formularios principales.
- [ ] Modo demo (`NEXT_PUBLIC_DEMO_MODE=true`) no se activa accidentalmente
  contra el build de producción — confirmar la variable en Render antes de
  ir a producción real (ver `docs/PRODUCTION_READINESS.md`).
