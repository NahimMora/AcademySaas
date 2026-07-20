# Plan de construcción y verificación

Leyenda: `[x]` implementado y verificado; `[ ]` pendiente de verificación.

El checklist refiere al código y entorno local. La validación contra Supabase/R2/SMTP/Render alojados requiere credenciales externas y figura como paso de staging en `FINAL_REPORT.md`.

## Fase 0 — Inspección

- [x] inspeccionar repositorio y detectar código existente (repositorio vacío)
- [x] registrar restricciones y alcance
- [x] definir versiones estables
- [x] crear documentación inicial y plan

## Fase 1 — Base técnica

- [x] inicializar Next.js 16 / React 19 / TypeScript estricto
- [x] configurar lint, formato, typecheck, Tailwind y componentes
- [x] Docker, Render, Supabase CLI, variables y CI

## Fase 2 — Esquema multi-tenant

- [x] migraciones, autorización, RLS, índices y constraints
- [x] auditoría append-only, seeds y pruebas de aislamiento

## Fase 3 — Auth y plataforma

- [x] login, recuperación, roles, clientes, suspensión y soporte auditado
- [x] academias, sedes, membresías e invitaciones

## Fase 4 — Alumnos

- [x] CRUD seguro, DNI único/enmascarado, tutores, estados, filtros y exportación
- [x] adaptador R2 para foto privada

## Fase 5 — Cursos y comisiones

- [x] cursos, comisiones, cupos, clases, profesores y porcentajes versionados

## Fase 6 — Inscripciones y cargos

- [x] inscripción transaccional, cuotas, descuentos, señas, abandono y mora

## Fase 7 — Pagos y caja

- [x] pagos, asignaciones, parciales, confirmación, reversión y comprobante PDF
- [x] caja simple, correo y outbox

## Fase 8 — QR

- [x] emisión/revocación, escáner, políticas, resultados, alertas y auditoría

## Fase 9 — Asistencia

- [x] nómina cerrada, ventana, cierre, solicitudes, correcciones e informes

## Fase 10 — Liquidaciones

- [x] reglas, estimación, snapshot, ajustes, PDF, pago docente y vista profesor

## Fase 11 — Alertas y notificaciones

- [x] centro in-app, outbox/reintentos, incidentes y adaptador WhatsApp desactivado

## Fase 12 — Informes

- [x] dashboards, CSV/XLSX/PDF, resumen mensual, historial y R2

## Fase 13 — Importación

- [x] plantillas, parsing, preview, validación, lotes, reporte y auditoría

## Fase 14 — QA y seguridad

- [x] unitarias, integración, RLS y E2E
- [x] rate limiting, headers, archivos, concurrencia, idempotencia y build

## Fase 15 — Producción y documentación

- [x] deployment, setup, backup, rollback, manual, demo, changelog e informe final
