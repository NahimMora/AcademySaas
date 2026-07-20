# Despliegue y operación

## Supabase

1. Crear un proyecto y guardar la contraseña de base fuera del repositorio.
2. Instalar/autenticar Supabase CLI, vincular con `supabase link --project-ref <ref>` y ejecutar `supabase db push`.
3. Generar tipos con `supabase gen types typescript --linked --schema public`.
4. En Auth, deshabilitar signup público y configurar redirects `https://academysaas.moraapps.com/**` y `https://academysaas.moraapps.com/reset-password`.
5. Crear el primer usuario por consola segura y luego insertar su `profile` y `platform_admins`; no reutilizar cuentas demo.
6. Revisar RLS con `supabase test db` antes de cada promoción.

Backups: habilitar PITR según plan, conservar dump lógico cifrado diario y probar restauración trimestral. Rollback: desplegar la imagen anterior y aplicar una migración compensatoria; nunca revertir una migración destructivamente sobre movimientos críticos.

## Cloudflare R2

Crear un bucket privado `academia-private`, una credencial limitada a ese bucket y CORS:

```json
[{"AllowedOrigins":["https://academysaas.moraapps.com"],"AllowedMethods":["PUT","GET"],"AllowedHeaders":["content-type"],"ExposeHeaders":["etag"],"MaxAgeSeconds":300}]
```

No hacer público el bucket. Las subidas usan firma de 5 minutos, luego `/api/files/finalize` verifica firma mágica, tamaño y prefijo del tenant. Las descargas usan firma de 2 minutos. Rotar las claves y mantener una política separada si en el futuro existen logos públicos.

## Render

`render.yaml` crea un Web Service Docker con health check `/api/health`. Configurar todas las variables de `.env.example`; en producción `NEXT_PUBLIC_DEMO_MODE=false`. El contenedor corre sin root, tiene health check y propaga SIGTERM con 10 segundos de gracia.

Cron jobs pueden invocar con `Authorization: Bearer $CRON_SECRET`:

```text
POST /api/cron/mark-overdue
POST /api/cron/process-outbox
POST /api/cron/generate-alerts
POST /api/cron/monthly-report
POST /api/cron/consistency
```

Frecuencia sugerida: vencimientos 01:10 diario, outbox cada 5 minutos, alertas cada hora, consistencia 03:00 diario e informe mensual el día 1 a las 04:00. Todos los horarios se expresan en `America/Argentina/Buenos_Aires` al programar Render.

## Cloudflare DNS y TLS

Crear CNAME `academysaas` (zona `moraapps.com`) hacia el hostname de Render, inicialmente DNS-only hasta que Render verifique el dominio; luego activar proxy naranja, TLS `Full (strict)`, Always Use HTTPS y una regla de no-cache para `/api/*`. No cachear respuestas autenticadas ni URLs firmadas.

## SMTP

Configurar host, puerto, TLS, usuario, clave y remitente. La aplicación encola antes de enviar; una indisponibilidad no revierte cobros. En desarrollo, el proveedor registra metadatos mínimos y deja el mensaje en outbox. Validar SPF, DKIM y DMARC antes de habilitar envíos.

## Checklist previo a producción

- Demo desactivada y claves rotadas.
- RLS/pgTAP y E2E pasan contra staging.
- Redirects Auth y dominio canónico correctos.
- Bucket privado, CORS y límites verificados.
- SMTP con SPF/DKIM/DMARC.
- Backup y restauración probados.
- Alertas de Render/Supabase y retención de logs.
- Plan de rollback ensayado.
