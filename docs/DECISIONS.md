# Decisiones técnicas y funcionales

## ADR-001 — Supabase en producción y modo demo local

La fuente de verdad productiva es PostgreSQL/Supabase, protegida por RLS y RPC. Para que la revisión local no dependa de credenciales externas, `NEXT_PUBLIC_DEMO_MODE=true` activa un repositorio de demostración en el navegador, aislado por sesión y reiniciable. No se habilita automáticamente en producción.

## ADR-002 — Next.js App Router como servidor dinámico

Se usa Next.js 16, React 19, TypeScript estricto y salida `standalone`. No existe exportación estática. Render ejecuta el servidor Node en el puerto indicado por `PORT` (3300 localmente).

## ADR-003 — Dinero y porcentajes

Todos los importes son enteros en centavos ARS. Los porcentajes se representan en puntos básicos (10.000 = 100 %) en lógica TypeScript y como `numeric(5,2)` con constraints en PostgreSQL. La comisión nace exclusivamente de asignaciones de pagos confirmados y elegibles.

## ADR-004 — Operaciones críticas

Inscripción/cupo, pagos/asignaciones, reversión, caja, check-in y liquidación se implementan como RPC transaccionales con idempotencia y bloqueo de filas. La UI nunca decide por sí sola el estado financiero.

## ADR-005 — Archivos y comunicaciones

Los objetos operativos son privados en R2 y se acceden mediante firmas breves generadas en servidor. El correo utiliza outbox; la caída de SMTP no revierte una transacción. WhatsApp queda detrás de feature flag, con contrato y outbox, sin proveedor real.

## ADR-006 — Navegación modular

Las vistas de operación comparten un shell mobile-first y un catálogo de módulos. Los recursos con identidad propia (alumno, comisión, workspace) mantienen rutas de detalle. Esta estructura reduce duplicación sin ocultar controles de rol.
