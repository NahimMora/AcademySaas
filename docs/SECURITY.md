# Seguridad

## Matriz resumida

| Capacidad | Superadmin | Owner | Recepción | Profesor |
|---|---:|---:|---:|---:|
| Operar otro workspace | soporte auditado | No | No | No |
| Academias/sedes | Todas | Gestiona las propias | Lee asignadas | Lee asignadas |
| Alumnos/inscripciones | Soporte | Gestiona | Gestiona asignados | Solo nómina |
| Pagos/caja | Soporte | Gestiona | Registra en sede | No |
| Asistencia | Soporte | Gestiona | Consulta/check-in | Propias y en ventana |
| Porcentajes/liquidación | Soporte | Gestiona/cierra | No | Solo propias |
| Auditoría | Global | Workspace | Limitada | Acciones propias |

RLS está activa en todas las tablas expuestas. Las funciones de autorización fijan `search_path`, validan membresía activa y estado del servicio, y evitan consultar tablas con políticas recursivas. El alcance de lectura se reduce de workspace a academia/sede; para profesores se valida la asignación de la comisión en cada fila. Las RPC bloquean entidades susceptibles a carreras y aceptan claves de idempotencia. Los roles `authenticated` no tienen escritura directa en tablas financieras/académicas críticas: deben usar RPC.

Se aplican CSP, `frame-ancestors`, `nosniff`, política de permisos, validación Zod, cookies `httpOnly`, rate limiting para login/QR/jobs, URLs R2 temporales, detección de MIME y límites de archivo. No se registran tokens, contraseñas, QR planos ni DNI completo. Auditoría no admite `UPDATE` ni `DELETE` para roles de aplicación.

Amenazas mitigadas: IDOR entre tenants, escalada horizontal/vertical, sobrecupo por carrera, doble pago/check-in, manipulación del estado de cargos, comisión sobre pagos pendientes, replay mediante idempotencia, exposición de archivos y borrado del rastro de auditoría.

`supabase/tests/rls.test.sql` impersona owner, recepción, profesor y superadmin. Comprueba otro tenant, otra academia/sede, nómina docente, prohibición de altas/pagos, suspensión, soporte auditado y bloqueo de UPDATE/DELETE de auditoría.
