# Arquitectura

La aplicación es un monolito modular Next.js desplegable como servicio Node. Los componentes de servidor resuelven sesión y contexto; las mutaciones productivas llaman RPC de Supabase con la sesión del usuario. `service_role` solo puede utilizarse en módulos explícitos de servidor para jobs administrativos.

```text
Navegador móvil/escritorio
        │ HTTPS + cookie segura
Next.js App Router (Render)
  ├─ autenticación/contexto
  ├─ validación Zod y rate limiting
  ├─ casos de uso / RPC
  ├─ reportes y URLs firmadas
  └─ jobs autenticados
        │
Supabase Auth + PostgreSQL/RLS ── outbox ── SMTP
        │
Cloudflare R2 privado (comprobantes, fotos, informes)
```

Los límites principales son plataforma, workspace, academia y sede. Toda tabla de negocio lleva `workspace_id`; las políticas llaman funciones `security definer` no recursivas para resolver membresía y alcance. Los registros críticos se anulan o versionan y la auditoría es append-only.

El modo demo sustituye únicamente el adaptador de persistencia y autenticación, conserva las reglas de dominio y permite una evaluación local reproducible.
