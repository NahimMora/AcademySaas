# Production Readiness — Academia SaaS

> Documento vivo — actualizar cuando cambie el estado, no dejar que quede
> viejo. Complementa a `FINAL_REPORT.md` (informe de cierre del build
> inicial, estático) con un snapshot verificable y una lista accionable de
> qué falta genuinamente antes de un deploy real. Fuente de verdad de
> alcance/decisiones sigue siendo `docs/DECISIONS.md` y `docs/ARCHITECTURE.md`.

## Verification snapshot (2026-07-13)

Corrido contra el estado actual del repo, en este orden:

| Verificación | Resultado |
|---|---|
| `npm run lint` (`--max-warnings=0`) | OK |
| `npx tsc --noEmit` | OK |
| `npm run test` (Vitest) | 15/15 |
| `npm run build` (Next.js standalone) | OK |
| `npm audit --omit=dev --audit-level=moderate` | 0 vulnerabilidades |
| `npm run test:e2e` (Playwright, chromium + Pixel 7) | 4/4 — ver nota abajo |
| `npm run db:test` (`supabase db reset` + pgTAP) | 22/22, `supabase/tests/rls.test.sql` |

**Nota sobre `test:e2e` en local:** el `webServer` de Playwright
(`playwright.config.ts`) usa `reuseExistingServer: true` y arranca `npm run
dev` si no hay nada en `:3300`. Si el dev server ya estaba corriendo *sin*
`NEXT_PUBLIC_DEMO_MODE=true` (ej. lanzado sin copiar `.env.example` a
`.env.local` primero), los 4 tests fallan con redirect a `/login` — **no es
un bug de la app**, es que el login demo no tiene con qué autenticar sin el
flag. Con el flujo documentado en `FINAL_REPORT.md` (`Copy-Item
.env.example .env.local` antes de `npm run dev`) esto no pasa, porque
`.env.example` ya trae `NEXT_PUBLIC_DEMO_MODE="true"` por defecto. El nuevo
job `e2e` de CI (`.github/workflows/ci.yml`) fija el flag explícitamente
por la misma razón: CI no tiene `.env.local`.

## Qué cambió en este ciclo

- Se agregó `docs/RUNBOOK.md`: procedimientos operativos (reset de
  contraseña, reversión de pago, corrección de liquidación, outbox
  trabado, fallo de cron, soporte auditado, rollback de deploy, dónde
  mirar logs) — no existía antes, solo estaba implícito en el código.
- Se agregó `docs/QA_CHECKLIST.md`: pase manual en navegador real por rol
  y pantalla, complementario a Playwright.
- CI (`.github/workflows/ci.yml`) ahora corre el job `e2e` (Playwright en
  modo demo) además de `quality` y `database` — antes Playwright solo se
  ejecutaba si alguien lo corría a mano en local.

## Pendientes reales antes de producción

- [ ] **Deploy real.** `docs/DEPLOYMENT.md` documenta Render + Supabase +
  R2 + Cloudflare + SMTP de punta a punta, pero no hay credenciales de una
  cuenta real cargadas todavía (confirmado en `FINAL_REPORT.md` — "Bloqueos
  y límites reales"). Falta: crear el proyecto Supabase hosted, el bucket
  R2, la cuenta Render, el dominio en Cloudflare, y cargar las variables de
  `.env.example` en cada plataforma.
- [ ] **Observabilidad externa.** `SENTRY_DSN` existe en `.env.example`
  pero **no se usa en ningún lado** — `lib/observability/logger.ts` solo
  emite JSON estructurado a stdout/stderr (`console.log`/`console.error`),
  sin envío a un servicio externo. Es una decisión pendiente a propósito:
  conectar Sentry (u otro) requiere credenciales/cuenta y no se hizo sin
  confirmación explícita, igual que la política ya documentada para R2.
  Mientras tanto, los logs estructurados en Render son la única fuente de
  errores no controlados en producción.
- [ ] **SMTP real.** El proveedor de correo usa outbox (`notification_outbox`)
  y funciona en modo desarrollo sin SMTP configurado (queda en la outbox).
  Antes de producción real hace falta un proveedor SMTP con SPF/DKIM/DMARC
  validados (checklist ya en `docs/DEPLOYMENT.md`).
- [ ] **WhatsApp.** Adaptador desacoplado detrás de `WHATSAPP_ENABLED=false`
  (ADR-005), sin proveedor real conectado — fuera de alcance del MVP según
  `FINAL_REPORT.md`.
- [ ] **Certificados y portal alumno.** Marcados explícitamente como
  "próximos pasos fuera del MVP" en `FINAL_REPORT.md` — requieren nuevo rol
  y políticas RLS de autoservicio (portal) o plantillas/versionado
  (certificados). No implementado.
- [ ] **Backups/restauración probados contra un proyecto real.** El
  procedimiento está documentado (`docs/DEPLOYMENT.md`: PITR + dump lógico
  diario + restauración trimestral) pero no ejercitado todavía porque no
  hay proyecto Supabase hosted.
- [ ] **Corrección retroactiva de liquidaciones cerradas.** Si se revierte
  un pago que ya formaba parte de una liquidación docente cerrada
  (`close_instructor_settlement`), no hay un mecanismo automático de ajuste
  — requiere una liquidación correctiva manual documentada (ver
  `docs/RUNBOOK.md`). Es una limitación conocida, no un bug.

## Verification snapshot (histórico — build inicial, `FINAL_REPORT.md`)

ESLint, TypeScript, Vitest 15/15, Playwright (Chromium + Pixel 7) 4/4,
`supabase db reset` + seed idempotente, pgTAP 22/22, Next production build,
Docker multi-stage + health smoke, `npm audit` producción 0
vulnerabilidades, búsqueda de secretos sin hallazgos. Sin credenciales de
plataformas externas (Supabase hosted, R2, SMTP, Render, Cloudflare), por
lo que esas integraciones se verificaron por build/adaptador y
configuración, no contra servicios reales.

## Checklist predeploy / postdeploy

**Predeploy** (ver detalle completo en `docs/DEPLOYMENT.md`)
- [ ] `npm run qa:full` en verde (lint, typecheck, test, build, audit,
  Playwright, pgTAP)
- [ ] Variables de `.env.example` cargadas en Render, con
  `NEXT_PUBLIC_DEMO_MODE=false`
- [ ] `supabase db push` aplicado contra el proyecto de producción
- [ ] Bucket R2 privado creado, CORS configurado, credencial limitada a ese
  bucket
- [ ] Redirects de Supabase Auth (`/reset-password`, dominio de
  producción) configurados, signup público deshabilitado
- [ ] Primer usuario creado por consola segura (no reutilizar cuentas demo)
- [ ] SMTP con SPF/DKIM/DMARC validados

**Postdeploy**
- [ ] `/api/health` y `/api/ready` responden 200
- [ ] Login con credenciales reales funciona (no demo)
- [ ] Flujo "olvidé mi contraseña" llega el mail y el link vuelve a la app
- [ ] Ciclo completo con datos reales: inscripción → cargo → pago → QR
  check-in → asistencia → liquidación docente
- [ ] Exportación de un informe (CSV/XLSX/PDF) descarga correctamente
- [ ] Cron jobs disparando con `Authorization: Bearer $CRON_SECRET` (no en
  modo `dry-run`)
- [ ] HTTPS activo en el dominio custom, proxy de Cloudflare confirmado
