# Runbook — Academia SaaS

> Procedimientos operativos para soporte de primer nivel (owner/recepción de
> una academia) y para quien mantenga la app técnicamente. Los primeros
> bloques no requieren leer código; los de rollback/logs sí asumen acceso a
> Render y a Supabase. Para variables de entorno y checklist de deploy ver
> `docs/DEPLOYMENT.md`; para qué falta antes de un deploy real ver
> `docs/PRODUCTION_READINESS.md`.

## Reset de contraseña

**Autoservicio (el usuario tiene acceso a su email):**
1. En `/login`, ir a `/forgot-password`.
2. Cargar el email → `POST /api/auth/forgot-password` llama
   `supabase.auth.resetPasswordForEmail` con `redirectTo:
   ${NEXT_PUBLIC_APP_URL}/reset-password`. La respuesta es siempre
   `{ok:true}` aunque el email no exista (no enumerable), por diseño.
3. El link del mail vuelve a `/reset-password`, donde el usuario carga la
   contraseña nueva contra Supabase Auth.
4. Si el mail no llega: confirmar en Supabase → Authentication → URL
   Configuration → Redirect URLs que `https://<dominio>/reset-password` esté
   habilitado (ver `docs/DEPLOYMENT.md`), y revisar SPF/DKIM/DMARC si el
   proyecto usa SMTP propio en vez del de Supabase.

**El usuario no tiene acceso a su email (soporte manual):**
1. No hay endpoint in-app para que un admin fije la contraseña de otro
   usuario.
2. Ir a Supabase Dashboard → Authentication → Users, buscar por email, usar
   "Send password recovery" (mismo flujo de arriba) o "Reset password" para
   fijar una temporal a mano.

## Reversión de un pago

Vía RPC `reverse_payment(p_payment_id, p_reason, p_idempotency_key)`
(`supabase/migrations/202607120003_transactional_rpcs.sql`):

1. La reversión exige rol con `can_manage_payments` (autorización backend
   vía RLS/`security definer`, no solo ocultamiento en el frontend).
2. Es transaccional: revierte las asignaciones del pago a los `charges`
   correspondientes y dispara `refresh_charge_status` para recalcular el
   estado de cada cuota afectada.
3. Queda auditado en `audit_logs` (append-only, sin `UPDATE`/`DELETE` para
   roles de aplicación — ver `docs/SECURITY.md`).
4. Si el pago ya fue tomado como base de una liquidación docente cerrada
   (`close_instructor_settlement`), la reversión puede dejar un desvío entre
   lo liquidado y lo realmente cobrado — no hay mecanismo automático de
   ajuste retroactivo de liquidaciones ya cerradas; requiere una liquidación
   correctiva manual documentada en `audit_logs`, igual que el caso de
   "comisión ya liquidada" en cualquier sistema de comisiones.

## Cierre de caja con diferencia

RPC `open_cash_session` / `close_cash_session(p_cash_session_id,
p_counted_cents, p_note)`:

1. El cierre no bloquea por tener diferencia entre lo esperado y lo
   contado — la diferencia queda registrada en la sesión cerrada.
2. Una vez cerrada, la sesión es el snapshot histórico: no se recalcula
   sola aunque después se revierta un pago de esa sesión.
3. Para dejar una nota o corrección sobre una caja ya cerrada, la vía es un
   registro nuevo auditado, no editar el cierre original — coherente con
   la regla de "corrección, no borrado" del proyecto (`docs/DECISIONS.md`
   ADR-004).

## Corrección de liquidación docente

RPC `calculate_commission_estimate` (previa, no vinculante) →
`close_instructor_settlement(p_settlement_id, p_reason)` (cierre) →
`register_instructor_payout(...)` (pago al profesor):

1. `close_instructor_settlement` fija un snapshot de la comisión calculada
   sobre pagos confirmados y elegibles (`docs/DECISIONS.md` ADR-003/ADR-004)
   — no se recalcula solo si después cambian los pagos base.
2. Si se cerró una liquidación por error o con datos incorrectos: no hay
   endpoint de "reabrir". La corrección es un registro nuevo (liquidación
   complementaria o nota de ajuste) con motivo explícito, auditado — evita
   que una liquidación ya pagada al profesor se reescriba silenciosamente.
3. `register_instructor_payout` acepta `p_idempotency_key`: reintentar la
   misma request (ej. por timeout de red) no duplica el pago.

## Solicitudes de corrección (aprobaciones)

RPC `resolve_approval_request(p_request_id, p_approve, p_comment)` resuelve
pedidos que quedaron en la cola de "Solicitudes" (`/app/requests`, badge en
el nav) — ej. correcciones de asistencia o excepciones que un
owner/recepción debe aprobar o rechazar con comentario. Queda en
`audit_logs`.

## Outbox trabado (emails / WhatsApp)

- `notification_outbox` y `whatsapp_outbox` (este último **desactivado**
  por feature flag, `WHATSAPP_ENABLED=false` — ver ADR-005) tienen índice
  `outbox_pending_idx` sobre `(status, next_attempt_at)` para `pending` y
  `failed`.
- El cron `POST /api/cron/process-outbox` (autenticado con `Authorization:
  Bearer $CRON_SECRET`, ver `app/api/cron/[job]/route.ts`) es el que drena
  la cola. Si los correos no salen:
  1. Confirmar que el job se está disparando (Render → Cron Jobs, o el
     scheduler externo que se haya configurado — ver frecuencias sugeridas
     en `docs/DEPLOYMENT.md`).
  2. Revisar filas `status='failed'` en `notification_outbox` — el motivo
     de fallo debería quedar en la fila o en los logs estructurados
     (`lib/observability/logger.ts`, nivel `error`).
  3. Una falla de SMTP **no revierte** el cobro ni la operación que generó
     la notificación (ADR-005) — el mensaje queda en `pending`/`failed`
     para reintento, no bloquea el flujo de negocio.

## Fallo de un cron job

Jobs válidos: `mark-overdue`, `process-outbox`, `generate-alerts`,
`monthly-report`, `consistency` (`app/api/cron/[job]/route.ts`).

1. La ruta responde `401` si el `Bearer` no coincide con `CRON_SECRET`
   (comparación `timingSafeEqualText`, no vulnerable a timing attack) y
   `404` si el nombre de job no existe en la lista — confirmar que el
   scheduler externo manda el secret y el nombre correctos.
2. En modo demo (`NEXT_PUBLIC_DEMO_MODE=true`) los jobs responden
   `mode:"dry-run"` sin tocar datos — si un cron "no hace nada" en
   staging, primero descartar que el flag de demo siga activo.
3. Cada corrida loguea `job.started` con un `runId` — usarlo para
   correlacionar en los logs de la plataforma (Render → Logs).

## Soporte auditado de superadmin sobre otro workspace

- `platform_admins` y `support_sessions` (`supabase/migrations/
  202607120001_foundation.sql`) implementan el acceso de soporte: un
  superadmin puede operar sobre el workspace de un cliente, pero queda
  registrado como sesión de soporte, no como acceso silencioso.
- Usar `/platform` → "Clientes" para localizar el workspace y entrar en
  modo soporte; toda acción durante esa sesión debe quedar en `audit_logs`
  igual que si la hiciera el propio owner (ver matriz de `docs/SECURITY.md`:
  "Operar otro workspace: soporte auditado").

## Restauración ante deploy fallido (Render)

1. Render → el servicio → pestaña **Events/Deploys** → elegir el deploy
   anterior que funcionaba → "Rollback", o re-desplegar manualmente el
   commit anterior desde GitHub.
2. **Importante — las migraciones de Supabase no se revierten solas.** Si
   el deploy fallido incluía `supabase db push` ya aplicado contra
   producción, hacer rollback del código a una versión anterior puede
   dejar la app corriendo contra un schema más nuevo del que espera:
   - Si la migración nueva fue aditiva (columnas/tablas nuevas, nullable o
     con default), el código viejo generalmente sigue funcionando.
   - Si fue destructiva o cambió un tipo/constraint/función RPC existente,
     el rollback de código **no alcanza** — hace falta una migración
     correctiva hacia adelante, nunca revertir el schema a mano fuera de
     una migración versionada (`docs/DECISIONS.md`, mismo espíritu que
     "corrección, no borrado").
3. Verificar `/api/health` y `/api/ready` después de cualquier rollback.

## Revisar logs

- **Logs de la plataforma** (crashes, requests, proceso): Render → el
  servicio → Logs. Es lo primero ante un 500 genérico o un deploy que no
  arranca — el contenedor corre `HEALTHCHECK` cada 30s contra
  `/api/health` (ver `Dockerfile`), así que un contenedor "unhealthy" en
  Render suele ser la primera señal.
- **Errores de aplicación ya clasificados:** `lib/observability/logger.ts`
  emite JSON estructurado por nivel (`debug`/`info`/`warn`/`error`) con
  redacción automática de claves sensibles (`password`, `token`, `secret`,
  `authorization`, `dni`, `qr`) — buscar `"level":"error"` en los logs de
  Render.
- **Qué pasó y quién lo hizo** (pago revertido, caja cerrada, liquidación
  cerrada, solicitud resuelta, acceso de soporte): `/app/audit` (workspace)
  o `/platform/audit` (global, superadmin) — son los `audit_logs`,
  append-only, con actor y detalle del cambio.
- **Secuencia de correos/WhatsApp:** `notification_outbox` /
  `whatsapp_outbox` y sus tablas de intentos (`*_delivery_attempts` en la
  migración de foundation) para reconstruir qué se envió y qué falló.
