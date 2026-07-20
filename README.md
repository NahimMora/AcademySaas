# Academia SaaS

MVP B2B multi-tenant para academias presenciales. Integra alumnos, cursos, comisiones, inscripciones, cargos, pagos, caja, QR, asistencia, solicitudes, alertas, liquidaciones, importaciones, informes y auditoría.

## Inicio local inmediato

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

Abrir `http://localhost:3300`. El valor de ejemplo activa un dataset local persistente en el navegador. Las cuentas están en [docs/DEMO.md](docs/DEMO.md).

## Supabase local

Requiere Docker Desktop:

```powershell
npx supabase start
npx supabase db reset --local
npx supabase test db
```

Copiar `API_URL` y `ANON_KEY` de `npx supabase status` a `.env.local` para probar autenticación real y cambiar `NEXT_PUBLIC_DEMO_MODE=false`.

## Calidad

```powershell
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
npm audit --omit=dev --audit-level=moderate
```

La documentación de arquitectura, seguridad, despliegue y operación está en `docs/`.
