# Demostración local

URL: `http://localhost:3300`

Clave común local: `Demo-3300!` (se puede reemplazar con `DEMO_PASSWORD`; no usar en producción).

| Rol | Cuenta | Inicio |
|---|---|---|
| Superadmin | `superadmin@demo.local` | `/platform` |
| Propietaria | `owner@demo.local` | `/app/dashboard` |
| Recepción | `recepcion@demo.local` | `/app/dashboard` |
| Profesor | `profesor@demo.local` | `/instructor/dashboard` |
| Owner cliente 2 (Supabase seed) | `owner2@demo.local` | prueba RLS |

## Recorrido recomendado

1. Entrar como propietaria, revisar dashboard, alumnos y la ficha de un alumno.
2. Crear un alumno y registrar un pago en efectivo o transferencia.
3. En Check-in usar `ACA-0001-FUS` (verde), `ACA-0007-FUS` (amarillo) y `ACA-0034-NOR` (rojo/otro tenant).
4. Resolver solicitudes y alertas; cerrar asistencia y revisar liquidación.
5. Generar CSV/XLSX/PDF desde Informes e importar una plantilla.
6. Entrar como profesor y confirmar que pagos/alumnos administrativos no aparecen en navegación ni son accesibles por URL.
7. Entrar como superadmin y revisar los cuatro estados de cliente y el detalle de soporte/suspensión.

Los cambios del modo demo viven en `localStorage`; Configuración → Restaurar datos demo vuelve al seed original.
