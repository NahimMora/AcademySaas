# PROMPT MAESTRO — ACADEMIA SAAS

## Instrucción principal

Actuá como arquitecto de software principal, desarrollador full-stack senior, especialista en PostgreSQL/Supabase, seguridad multi-tenant, UX mobile-first, QA y DevOps.

Tu misión es construir desde cero un MVP funcional, demostrable y preparado para producción de un SaaS B2B de gestión para academias presenciales, inicialmente orientado a escuelas de barbería pero diseñado sin acoplarse exclusivamente a ese rubro.

No entregues solamente documentación, wireframes, ejemplos o un esqueleto. Implementá la aplicación completa dentro del repositorio disponible. Trabajá de forma autónoma durante todo el tiempo disponible. No te detengas a pedir decisiones menores: elegí la opción más segura, simple y mantenible, documentá la decisión en `docs/DECISIONS.md` y continuá.

Solo detenete si existe un bloqueo externo imposible de resolver sin credenciales o sin acceso a un servicio. En ese caso:

1. Terminá todo lo que pueda funcionar localmente.
2. Implementá un adaptador o modo mock seguro.
3. Dejá `.env.example`.
4. Dejá instrucciones exactas de configuración.
5. Continuá con las demás tareas.
6. No declares el proyecto terminado si las pruebas o verificaciones obligatorias fallan.

Creá y mantené desde el primer momento:

- `TODO.md`: checklist vivo y ordenado por fases.
- `docs/DECISIONS.md`: decisiones técnicas y funcionales.
- `docs/ARCHITECTURE.md`: arquitectura.
- `docs/SECURITY.md`: modelo de seguridad, RLS y amenazas mitigadas.
- `docs/DEPLOYMENT.md`: Supabase, Cloudflare, R2 y Render.
- `docs/USER_GUIDE.md`: guía operativa en español.
- `docs/DEMO.md`: cuentas y recorrido de demostración.
- `CHANGELOG.md`.
- `.env.example`.

Marcá cada tarea en `TODO.md` únicamente después de implementarla y verificarla.

---

# 1. Definición del producto

Nombre técnico provisional:

```text
Academia SaaS
```

Nombre del repositorio sugerido:

```text
academia-saas
```

El nombre de plataforma debe ser configurable. No debe quedar rígidamente incrustado en el código.

Cada cliente del SaaS tendrá su propia cuenta o espacio de trabajo. Un cliente puede administrar una o varias academias. Cada academia puede tener una o varias sedes.

Ejemplo:

```text
Plataforma Academia SaaS
├── Cliente A
│   ├── Academia Fusión
│   │   ├── Sede Centro
│   │   └── Sede Norte
│   └── Academia Imperio
│       └── Sede Principal
└── Cliente B
    └── Academia Estilo
        ├── Sede Salta
        └── Sede La Rioja
```

El sistema es un servicio SaaS, no una aplicación instalada y vendida individualmente.

Debe existir aislamiento estricto entre clientes. Ningún usuario de un cliente puede consultar, inferir, modificar, exportar ni enumerar datos pertenecientes a otro cliente.

---

# 2. Objetivo operativo

La aplicación reemplaza planillas manuales utilizadas para administrar:

- alumnos;
- responsables o tutores de menores;
- academias y sedes;
- cursos;
- comisiones o grupos de cursada;
- cupos;
- inscripciones;
- clases programadas;
- asistencias;
- check-in mediante QR;
- cuotas;
- señas y pagos parciales;
- comprobantes internos;
- caja operativa simple;
- porcentajes de profesores;
- liquidaciones mensuales;
- pagos a profesores;
- solicitudes de autorización;
- alertas;
- notificaciones;
- auditoría;
- importaciones;
- informes;
- exportaciones;
- resumen mensual PDF.

Problema central que debe resolver:

Un profesor no debe poder agregar alumnos informalmente, cobrarles por fuera de la academia, inflar la cantidad de alumnos, mantener alumnos abandonados como activos ni generar una liquidación sobre dinero que no ingresó oficialmente.

La liquidación del profesor debe originarse únicamente en pagos oficiales confirmados y correctamente asignados a conceptos válidos dentro del sistema.

La aplicación no puede impedir por sí sola que físicamente entre una persona no registrada, pero sí debe:

- impedir que tenga inscripción oficial;
- impedir que tenga asistencia oficial sin una inscripción válida;
- mostrar claramente su rechazo al escanear QR;
- registrar cada intento;
- notificar a recepción o administración;
- impedir que genere comisión docente;
- conservar evidencia de la operación;
- permitir registrar un incidente.

No implementar fotografía del aula en este MVP.

---

# 3. Infraestructura obligatoria

## Aplicación

- Next.js con App Router.
- TypeScript en modo estricto.
- Aplicación dinámica ejecutada como servidor Node.js.
- Despliegue principal en Render como Web Service.
- Dockerfile de producción.
- `render.yaml`.
- Health check.
- Graceful shutdown.
- Build reproducible.
- No implementar la aplicación como exportación estática.

## Base de datos y autenticación

- Supabase PostgreSQL.
- Supabase Auth.
- Supabase CLI y migraciones SQL versionadas.
- Row Level Security en todas las tablas expuestas.
- Funciones PostgreSQL para operaciones financieras y transaccionales.
- Tipos TypeScript generados desde el esquema cuando sea posible.

## Archivos

- Cloudflare R2.
- Bucket privado para archivos operativos.
- Acceso mediante URL firmada de corta duración.
- Nunca guardar secretos de R2 en el navegador.
- Subidas mediante URL firmada o endpoint de servidor seguro.
- Validar tamaño, MIME real, extensión y permisos.
- El dominio se administra mediante Cloudflare DNS.
- El dominio principal de la aplicación apunta a Render.
- R2 se utiliza para objetos, no para ejecutar la aplicación.
- Permitir en el futuro un bucket público separado exclusivamente para logos o recursos que realmente sean públicos.

## Correo

Crear una abstracción de proveedor:

```ts
interface EmailProvider {
  send(message: EmailMessage): Promise<EmailResult>
}
```

Implementar:

- proveedor SMTP configurable;
- proveedor de desarrollo que no envía y registra en la bandeja de salida;
- cola/outbox persistente;
- reintentos;
- estados de entrega;
- plantillas;
- logs sin exponer contenido sensible innecesario.

## WhatsApp

No integrar un proveedor real todavía.

Dejar arquitectura preparada:

```ts
interface WhatsAppProvider {
  send(message: WhatsAppMessage): Promise<WhatsAppResult>
}
```

Crear feature flag desactivado y tablas de plantillas, consentimiento, outbox, intentos y entrega.

---

# 4. Principios de implementación

1. Multi-tenant desde la primera migración.
2. Seguridad en la base de datos, no solamente en la interfaz.
3. Mobile-first para todos los roles.
4. Interfaz íntegramente en español.
5. Zona horaria predeterminada: `America/Argentina/Buenos_Aires`.
6. Moneda inicial: ARS.
7. Dinero almacenado como enteros en centavos o unidad monetaria mínima; nunca `float`.
8. UUID para identificadores internos.
9. Identificadores públicos opacos separados de los UUID sensibles cuando corresponda.
10. Fechas de auditoría en UTC y presentación en zona local.
11. Ningún registro financiero o académico crítico debe borrarse físicamente desde la aplicación.
12. Correcciones mediante anulación, estado, versión, ajuste o solicitud.
13. Toda acción crítica debe ser idempotente.
14. Toda mutación debe validar el tenant, la academia, la sede y el rol.
15. No confiar en datos enviados por el cliente.
16. No utilizar `service_role` en código cliente.
17. Aislar cualquier uso de `service_role` en módulos de servidor explícitos.
18. Preferir operaciones con sesión del usuario y RLS.
19. Para operaciones complejas, utilizar RPC PostgreSQL seguras y transaccionales.
20. Evitar sobrediseñar funciones fuera del alcance, pero dejar puntos de extensión claros.

---

# 5. Jerarquía de datos y tenancy

Implementar estas entidades principales:

```text
Plataforma
└── Workspace / Cuenta cliente
    ├── Miembros
    ├── Estado del servicio
    ├── Academias
    │   ├── Configuración y branding
    │   ├── Sedes
    │   ├── Cursos
    │   ├── Comisiones
    │   ├── Alumnos
    │   ├── Pagos
    │   └── Liquidaciones
    └── Informes consolidados
```

Cada registro de negocio debe contener como mínimo `workspace_id`. Cuando corresponda, también `academy_id` y `branch_id`.

No confiar únicamente en filtros de frontend.

Crear funciones SQL reutilizables para autorización, por ejemplo:

- `is_platform_superadmin()`
- `is_workspace_owner(workspace_id)`
- `has_workspace_access(workspace_id)`
- `has_academy_access(academy_id)`
- `has_branch_access(branch_id)`
- `can_manage_students(academy_id)`
- `can_manage_payments(academy_id)`
- `can_manage_attendance(cohort_id)`
- `can_manage_settlements(academy_id)`

Las funciones deben ser seguras, estables, documentadas y evitar recursión accidental en políticas RLS.

---

# 6. Roles definitivos del MVP

No crear un rol de alumno autenticado en este MVP.

## 6.1 Superadministrador de plataforma

Código sugerido:

```text
platform_superadmin
```

Es el operador y dueño del SaaS.

Puede:

- ver todas las cuentas cliente;
- crear cuentas;
- crear el primer propietario;
- cambiar estado del servicio;
- suspender y reactivar una cuenta;
- archivar una cuenta;
- bloquear o desactivar usuarios;
- transferir la propiedad;
- ver métricas de uso;
- ver academias y sedes;
- gestionar feature flags;
- configurar límites;
- consultar auditoría global;
- acceder a soporte;
- ejecutar exportaciones autorizadas;
- registrar notas internas;
- gestionar plan y estado de pago manual;
- habilitar un modo de soporte temporal y auditado.

No debe existir acceso oculto. Cuando use modo soporte:

- exigir motivo;
- mostrar banner persistente;
- registrar inicio y fin;
- limitar duración;
- registrar acciones;
- permitir modo solo lectura;
- nunca borrar el rastro.

Estados del cliente:

```text
trial
active
past_due
suspended
cancelled
archived
```

El MVP no necesita cobrar suscripciones automáticamente. Implementar administración manual de:

- plan;
- fecha de alta;
- fecha de próxima revisión o vencimiento;
- estado;
- nota de facturación;
- límites;
- razón de suspensión.

Cuando un workspace está suspendido:

- sus usuarios no pueden operar;
- pueden ver una pantalla clara de servicio pausado;
- el superadministrador conserva acceso;
- no se pierden datos;
- las tareas críticas no deben continuar generando movimientos, salvo tareas internas necesarias.

## 6.2 Propietario del cliente

Código sugerido:

```text
owner
```

Puede administrar todas las academias y sedes pertenecientes a su workspace.

Puede:

- crear y editar academias;
- crear y editar sedes;
- invitar, desactivar y asignar usuarios;
- administrar alumnos;
- administrar cursos y comisiones;
- registrar y corregir pagos según reglas;
- ver cajas;
- configurar porcentajes docentes;
- cerrar liquidaciones;
- registrar pagos a profesores;
- aprobar o rechazar solicitudes;
- ver informes;
- exportar datos;
- revisar alertas;
- ver auditoría dentro de su workspace;
- configurar políticas de acceso QR;
- configurar notificaciones;
- archivar entidades cuando corresponda.

No puede:

- acceder a otro workspace;
- convertirse en superadministrador;
- eliminar auditoría;
- borrar pagos, asistencias o liquidaciones;
- modificar un período cerrado sin flujo de reapertura o ajuste.

## 6.3 Recepcionista

Código sugerido:

```text
receptionist
```

Puede operar únicamente en academias y sedes asignadas.

Puede:

- buscar y crear alumnos;
- actualizar datos operativos permitidos;
- crear inscripciones si existe cupo;
- registrar señas y pagos;
- adjuntar comprobantes;
- emitir comprobantes internos;
- abrir y cerrar caja simple;
- escanear QR;
- registrar check-in;
- ver deuda y estado de inscripción;
- registrar incidentes;
- ver clases del día;
- procesar solicitudes operativas cuando el propietario lo autorice;
- consultar reportes operativos limitados.

No puede:

- cambiar porcentajes docentes;
- cerrar liquidaciones;
- pagar profesores;
- gestionar propietarios;
- cambiar el plan SaaS;
- acceder a otra academia o sede;
- eliminar datos críticos;
- modificar auditoría.

## 6.4 Profesor

Código sugerido:

```text
instructor
```

Puede:

- ver sus comisiones;
- ver la nómina oficial;
- ver clases;
- registrar y cerrar asistencia dentro de la ventana;
- solicitar correcciones;
- informar incidentes;
- ver su liquidación estimada;
- ver liquidaciones cerradas;
- ver pagos docentes registrados;
- descargar su comprobante de liquidación.

No puede:

- crear alumnos;
- agregar personas manualmente a una nómina;
- inscribir alumnos;
- registrar pagos;
- modificar cuotas;
- modificar porcentajes;
- cambiar el estado financiero;
- ver comprobantes bancarios del alumno;
- ver otras comisiones;
- editar asistencias antiguas directamente;
- cerrar liquidaciones;
- borrar registros.

---

# 7. Autenticación y usuarios

Implementar:

- inicio de sesión por correo y contraseña;
- recuperación de contraseña;
- invitación de usuarios;
- cambio obligatorio de contraseña inicial cuando corresponda;
- cierre de sesión;
- sesiones seguras;
- protección de rutas;
- desactivación inmediata de usuarios;
- estado de membresía;
- último acceso;
- registro de intentos fallidos cuando sea viable;
- página de acceso denegado;
- manejo del workspace suspendido;
- selección de academia y sede cuando el usuario tenga acceso a varias;
- persistencia segura del contexto activo;
- nunca aceptar un `workspace_id` del navegador sin verificar membresía.

Tablas sugeridas:

- `profiles`
- `platform_admins`
- `workspace_memberships`
- `academy_memberships`
- `branch_memberships`
- `user_invitations`
- `support_sessions`

Un usuario puede tener varias membresías, pero el MVP debe mantener reglas comprensibles.

---

# 8. Configuración y branding

Por workspace y por academia:

- nombre;
- nombre legal opcional;
- logo opcional;
- colores;
- correo;
- teléfono;
- WhatsApp;
- dirección;
- localidad;
- provincia;
- zona horaria;
- moneda;
- política de mora;
- política QR;
- cupo predeterminado;
- porcentaje docente predeterminado;
- texto del comprobante interno;
- pie del informe PDF;
- feature flags.

La interfaz debe mostrar el nombre y logo de la academia seleccionada, pero conservar una referencia discreta a la plataforma SaaS.

---

# 9. Alumnos y legajo

El alumno es una entidad administrativa sin credenciales de acceso en el MVP.

Campos:

- UUID interno;
- código público;
- workspace;
- academia principal;
- nombre;
- apellido;
- DNI;
- fecha de nacimiento;
- teléfono;
- WhatsApp;
- correo electrónico;
- domicilio opcional;
- localidad;
- provincia;
- contacto de emergencia;
- teléfono de emergencia;
- foto de perfil opcional;
- observaciones internas;
- consentimiento de comunicaciones;
- fecha de alta;
- estado;
- creado por;
- actualizado por;
- timestamps;
- archivado en;
- motivo de archivo.

DNI:

- obligatorio;
- normalizado;
- único por workspace;
- no mostrar completo en listados donde no sea necesario;
- buscar por DNI;
- impedir duplicados;
- permitir corregirlo con auditoría y confirmación reforzada.

Correo:

- recomendado pero puede ser nulo;
- validar formato;
- registrar preferencia de comunicación.

Foto:

- opcional;
- R2 privado;
- miniatura o URL firmada;
- límites de tamaño;
- formatos seguros;
- no usar para reconocimiento facial.

Menores:

Crear entidad `student_guardians`:

- nombre;
- apellido;
- DNI opcional;
- vínculo;
- teléfono;
- WhatsApp;
- correo;
- es contacto principal;
- autorización o nota administrativa;
- timestamps.

No subir frente ni dorso del DNI en este MVP.

Dejar un modelo futuro de documentos, pero sin obligar ni desarrollar una gestión documental compleja. Una tabla `student_documents` puede existir detrás de feature flag o quedar documentada para una migración futura.

Estados generales:

```text
active
inactive
blocked
archived
```

Nunca confundir estado general con estado de inscripción.

Funciones de UI:

- listado;
- búsqueda;
- filtros;
- alta;
- edición;
- perfil;
- historial;
- inscripciones;
- cuotas;
- pagos;
- asistencia;
- check-ins;
- incidentes;
- auditoría vinculada;
- exportación.

---

# 10. Cursos

Un curso es la definición académica reutilizable.

Campos:

- workspace;
- academy;
- nombre;
- código;
- descripción;
- duración estimada;
- cantidad predeterminada de cuotas;
- frecuencia sugerida;
- duración de clase;
- cupo sugerido;
- precio sugerido;
- moneda;
- porcentaje docente sugerido opcional;
- activo;
- timestamps;
- archivado.

No implementar certificados ni evaluaciones académicas completas en el MVP.

Dejar preparada una extensión futura, sin exponer pantallas vacías.

---

# 11. Comisiones o grupos de cursada

La comisión es una edición concreta de un curso.

Campos:

- workspace;
- academy;
- branch;
- course;
- código único;
- nombre visible;
- profesor;
- día o patrón semanal;
- hora de inicio;
- hora de finalización;
- fecha de inicio;
- fecha estimada de finalización;
- cupo;
- número de cuotas;
- valor de cada cuota;
- vencimiento relativo;
- porcentaje docente;
- estado;
- política de acceso por deuda;
- observaciones;
- timestamps;
- creado por;
- archivado.

Estados:

```text
draft
scheduled
active
paused
finished
cancelled
archived
```

Cupo:

- predeterminado 8;
- configurable por comisión;
- bloquear inscripción cuando no haya lugar;
- superar cupo únicamente mediante solicitud aprobada;
- registrar cupo anterior, cupo nuevo, motivo, solicitante y aprobador;
- nunca permitir que el profesor altere el cupo.

Mostrar:

- ocupación;
- vacantes;
- alumnos activos;
- abandonos;
- cuotas cobradas;
- deuda;
- próximas clases;
- asistencia;
- liquidación estimada.

Profesor suplente no forma parte del flujo principal del MVP. Dejar el modelo preparado para una versión futura sin agregar complejidad innecesaria a la interfaz.

---

# 12. Inscripciones

Tabla `enrollments`.

Campos:

- workspace;
- academy;
- branch;
- student;
- cohort;
- código;
- fecha de inscripción;
- fecha de inicio efectiva;
- estado;
- precio acordado;
- cantidad de cuotas;
- descuento simple;
- observaciones;
- fecha de abandono;
- motivo de abandono;
- política aplicada a cuotas futuras;
- creado por;
- timestamps.

Estados:

```text
pre_enrolled
pending_payment
confirmed
attending
suspended
overdue
dropped_out
completed
cancelled
expelled
```

Reglas:

- un alumno no puede tener dos inscripciones activas incompatibles en la misma comisión;
- validar cupo de manera transaccional;
- la inscripción confirmada genera las cuotas;
- la nómina de asistencia se deriva de inscripciones válidas;
- el profesor no puede crear ni editar inscripciones;
- una baja no borra registros previos;
- alumnos abandonados no aparecen como elegibles en clases futuras;
- pagos previos permanecen;
- cuotas futuras se cancelan según regla;
- cuotas ya vencidas permanecen como deuda por defecto.

Abandono predeterminado:

```text
Cancelar cuotas posteriores a la fecha efectiva de abandono.
Conservar cuotas vencidas y pagos históricos.
```

No implementar reincorporación automatizada en el MVP. Una reincorporación futura debe crear un flujo explícito; documentarlo.

---

# 13. Descuentos simples

Evitar un motor complejo de becas o promociones.

Permitir únicamente:

- descuento fijo;
- descuento porcentual.

Aplicación:

- por inscripción;
- por comisión;
- opcionalmente por una cuota específica.

Campos:

- tipo;
- valor;
- motivo;
- aprobado por;
- fecha;
- afecta base comisionable: sí/no.

Valor predeterminado:

La comisión docente se calcula sobre el dinero oficial efectivamente cobrado y elegible, no sobre el precio de lista.

No implementar promociones familiares, convenios o becas avanzadas.

---

# 14. Generación de clases

Tabla `class_sessions`.

Al activar una comisión:

- generar clases según patrón semanal;
- permitir regeneración segura antes de que existan movimientos;
- detectar duplicados;
- permitir editar sesiones futuras.

Campos:

- workspace;
- academy;
- branch;
- cohort;
- fecha;
- inicio;
- fin;
- profesor previsto;
- estado;
- motivo;
- sesión original si es reprogramación;
- abierto para asistencia;
- asistencia cerrada;
- timestamps.

Estados:

```text
scheduled
open
completed
cancelled
rescheduled
extra
```

Permitir:

- suspender;
- reprogramar;
- crear recuperatoria;
- crear clase adicional;
- cambiar hora;
- registrar motivo.

Toda modificación debe auditarse.

---

# 15. Control de asistencia

Tabla `attendance_records`.

Estados:

```text
present
absent
late
justified
left_early
not_applicable
```

Reglas:

- la lista proviene únicamente de inscripciones elegibles;
- el profesor no puede escribir un nombre libre;
- el profesor solo accede a sus comisiones;
- ventana predeterminada: desde 30 minutos antes del inicio hasta 6 horas después del final;
- propietario puede configurar la ventana;
- una vez cerrada la asistencia, queda bloqueada;
- una corrección posterior exige solicitud;
- conservar valor anterior, nuevo valor, motivo, solicitante y aprobador;
- check-in QR puede sugerir `present`, pero el profesor debe revisar y cerrar;
- no crear asistencia para personas rechazadas en QR;
- registrar hora de primera edición y cierre;
- registrar actor.

Pantalla mobile-first:

- encabezado con comisión, sede y horario;
- listado grande y táctil;
- búsqueda;
- botones claros;
- guardado robusto;
- indicador offline/no implementado: no fingir soporte offline;
- aviso de ventana;
- confirmación al cerrar;
- resumen presentes/ausentes/tardes;
- bloqueo posterior.

---

# 16. QR y check-in en recepción

Incluirlo en el MVP.

## 16.1 Credencial QR

Cada alumno tendrá una credencial QR:

- token opaco aleatorio de alta entropía;
- almacenar hash del token, no el token plano cuando sea viable;
- versión;
- emitido en;
- revocado en;
- estado;
- motivo de revocación;
- regeneración;
- nunca incluir DNI, deuda ni datos personales en el QR;
- permitir descargar o imprimir tarjeta QR administrativa.

El QR puede ser estático durante el MVP y revocable. Diseñar la abstracción para permitir QR dinámico en el futuro.

## 16.2 Escáner

Crear pantalla exclusiva para recepción:

```text
/check-in
```

Debe:

- usar cámara del dispositivo;
- tener ingreso manual de código como alternativa;
- funcionar en móvil;
- mostrar permiso de cámara;
- manejar errores;
- evitar escaneos duplicados accidentales;
- registrar el dispositivo o sesión;
- tener feedback visual, textual y sonoro opcional;
- no exponer información de otro tenant.

## 16.3 Validación

Al escanear:

1. validar QR;
2. validar workspace y academia activa;
3. validar alumno activo;
4. buscar clase actual compatible por academia, sede, comisión y ventana;
5. validar inscripción;
6. validar estado de inscripción;
7. consultar estado de cuotas;
8. consultar check-in previo;
9. aplicar política de acceso;
10. registrar resultado;
11. notificar cuando corresponda.

Resultados:

### Verde — autorizado

Mostrar:

- nombre y apellido;
- foto opcional;
- academia;
- sede;
- comisión;
- curso;
- clase;
- estado de cuota;
- hora;
- mensaje `ACCESO AUTORIZADO`.

Registrar check-in.

### Amarillo — autorizado con advertencia o requiere decisión

Casos:

- cuota pendiente;
- pago parcial;
- mora dentro de tolerancia;
- inscripción en revisión;
- clase compatible no exacta;
- autorización manual.

Mostrar mensaje claro y botones según permiso:

- permitir con motivo;
- rechazar;
- solicitar autorización al propietario.

Toda excepción queda auditada.

### Rojo — denegado

Casos:

- QR inválido;
- QR revocado;
- alumno inexistente;
- alumno bloqueado;
- sin inscripción;
- comisión incorrecta;
- sede incorrecta;
- clase fuera de horario;
- abandono;
- expulsión;
- servicio del cliente suspendido;
- política de deuda bloqueante.

No registrar asistencia. Registrar intento denegado y generar alerta según severidad.

## 16.4 Política de deuda configurable

Por academia o comisión:

```text
inform_only
allow_with_warning
block_if_overdue
block_if_no_confirmed_payment
manual_review
```

Valor predeterminado:

```text
allow_with_warning
```

Esto evita que la aplicación tome una decisión comercial rígida por todas las academias. Recepción siempre ve el estado.

## 16.5 Sin clase exacta

No permitir un check-in ambiguo silencioso. Recepción puede seleccionar entre las clases compatibles únicamente si tiene permiso y debe quedar registrado.

## 16.6 Duplicados

Un alumno no puede generar múltiples check-ins activos para la misma clase. Mostrar el check-in anterior y permitir registrar una observación, no duplicar.

---

# 17. Cuotas y cargos

Separar cargos de pagos.

Tabla sugerida:

```text
charges
```

Cada cargo representa una obligación:

- cuota;
- seña;
- matrícula opcional;
- ajuste;
- otro concepto autorizado.

Campos:

- workspace;
- academy;
- enrollment;
- cohort;
- student;
- tipo;
- número de cuota;
- descripción;
- importe original;
- descuento;
- recargo simple;
- importe final;
- vencimiento;
- estado;
- período de servicio;
- cancelado en;
- motivo;
- timestamps.

Estados:

```text
pending
partial
paid
overdue
cancelled
waived
under_review
```

La inscripción genera la cantidad configurable de cuotas.

Evitar duplicados mediante claves únicas.

El estado debe derivarse de asignaciones de pago, no editarse arbitrariamente.

---

# 18. Pagos, señas y pagos parciales

Tablas:

- `payments`
- `payment_allocations`
- `payment_receipts`
- `payment_reversals` o modelo equivalente.

Un pago puede asignarse a uno o varios cargos, pero la UI del MVP debe priorizar el caso simple.

Campos del pago:

- workspace;
- academy;
- branch;
- student;
- fecha efectiva;
- fecha de registro;
- importe;
- moneda;
- medio;
- estado;
- cuenta receptora opcional;
- referencia;
- comprobante R2 opcional;
- recibido por;
- caja asociada;
- observaciones;
- idempotency key;
- timestamps.

Medios:

```text
cash
bank_transfer
mercado_pago
debit_card
credit_card
other
```

Estados:

```text
pending_validation
confirmed
rejected
reversed
refunded
```

Reglas:

- permitir seña;
- permitir pago parcial;
- permitir varios pagos para una misma cuota;
- no sobrescribir movimientos;
- efectivo puede confirmarse al registrar si la caja está abierta;
- transferencia puede quedar pendiente;
- solo pagos confirmados reducen deuda;
- solo pagos confirmados y elegibles generan comisión docente;
- reversión mediante operación separada;
- no borrar;
- validar suma de asignaciones;
- impedir asignar más que el saldo sin flujo de saldo a favor;
- implementar saldo a favor solo si resulta necesario; de lo contrario rechazar sobrepago con mensaje claro.

Comprobante de transferencia:

- opcional/configurable en MVP;
- recomendado;
- si la academia exige comprobante, bloquear confirmación sin archivo o referencia;
- R2 privado.

---

# 19. Comprobante interno

Generar comprobante interno PDF por pago confirmado.

Debe decir claramente que es un comprobante interno del sistema y no afirmar que reemplaza documentación fiscal.

Campos:

- número correlativo por academia;
- nombre y logo;
- alumno;
- DNI parcialmente enmascarado;
- academia;
- sede;
- comisión;
- concepto;
- importe;
- fecha;
- medio;
- saldo restante;
- usuario que registró;
- código de verificación;
- hash o identificador;
- texto configurable;
- fecha de emisión.

Guardar el PDF en R2 privado o generarlo bajo demanda con registro de emisión.

Permitir:

- descargar;
- reenviar por correo;
- regenerar sin cambiar los datos;
- anular visualmente cuando el pago se revierte.

No implementar facturación fiscal o integración tributaria.

---

# 20. Caja simple

No construir contabilidad general.

Objetivo: controlar efectivo de recepción sin saturar al usuario.

Tabla `cash_sessions`.

Flujo:

1. abrir caja;
2. saldo inicial opcional;
3. registrar automáticamente pagos en efectivo;
4. ver total esperado;
5. cerrar caja;
6. informar efectivo contado;
7. mostrar diferencia;
8. registrar observación.

No implementar en MVP:

- gestión compleja de proveedores;
- gastos generales;
- categorías contables;
- conciliación bancaria completa;
- libro mayor.

Reglas:

- pago en efectivo requiere caja abierta, salvo permiso especial del propietario;
- una recepcionista no puede tener dos cajas abiertas en la misma sede;
- cierre bloquea edición;
- reversión posterior genera ajuste visible;
- registrar diferencia;
- resumen descargable.

---

# 21. Comisión económica del profesor

Este módulo es crítico.

## 21.1 Regla base

```text
Base comisionable =
pagos oficiales confirmados
asignados a cargos elegibles
menos reversiones y devoluciones
menos conceptos no comisionables
```

```text
Comisión del profesor =
base comisionable × porcentaje aplicable
```

No usar:

- cantidad de alumnos escritos;
- cantidad de presentes;
- cuotas prometidas;
- pagos pendientes;
- transferencias no confirmadas;
- dinero externo;
- alumnos abandonados sin cargos válidos;
- cargos cancelados.

## 21.2 Elegibilidad

Un pago es comisionable únicamente cuando:

- está confirmado;
- pertenece al mismo workspace;
- está asignado a una inscripción y cargo válidos;
- el cargo no está cancelado;
- corresponde a la comisión;
- la inscripción era válida para el período de servicio;
- no fue revertido;
- el concepto está marcado como comisionable.

Si existe una situación dudosa, crear alerta y excluir hasta revisión.

## 21.3 Porcentajes

Mantenerlo simple.

Prioridad:

1. porcentaje específico de la comisión;
2. porcentaje predeterminado del profesor dentro de la academia;
3. porcentaje predeterminado de la academia.

Versionar reglas. Un cambio no modifica cierres anteriores.

Tablas sugeridas:

- `instructor_profiles`
- `commission_rules`
- `commission_rule_versions`

Campos:

- porcentaje;
- vigencia desde;
- vigencia hasta;
- academia;
- profesor;
- comisión opcional;
- creado por;
- motivo.

## 21.4 Estimación

Profesor y propietario pueden ver una estimación del período abierto.

Marcarla como:

```text
Estimación sujeta a confirmaciones, reversiones y cierre.
```

Nunca mostrarla como pagada.

---

# 22. Cierre y liquidación mensual

Tablas:

- `settlement_periods`
- `instructor_settlements`
- `settlement_items`
- `instructor_payouts`
- `settlement_adjustments`

Estados:

```text
open
under_review
closed
partially_paid
paid
reopened
cancelled
```

Proceso:

1. seleccionar academia, comisión, profesor y mes;
2. calcular base;
3. mostrar detalle por alumno, cargo y pago;
4. mostrar exclusiones y motivos;
5. mostrar porcentaje;
6. mostrar parte del profesor;
7. mostrar parte de la academia;
8. validar inconsistencias;
9. cerrar;
10. congelar snapshot;
11. generar PDF;
12. registrar pago al profesor;
13. permitir pago parcial;
14. marcar pagada al completar.

Al cerrar, guardar un snapshot inmutable:

- datos del profesor;
- comisión;
- período;
- pagos incluidos;
- porcentaje;
- importes;
- regla aplicada;
- fecha de corte;
- actor;
- hash o versión.

Un pago tardío entra al período abierto siguiente o genera ajuste explícito. No recalcular silenciosamente un cierre.

Reabrir:

- solo propietario;
- motivo obligatorio;
- auditoría;
- estado visible;
- no borrar el cierre previo;
- preferir ajuste en período siguiente.

Pago al profesor:

- importe;
- fecha;
- medio;
- referencia;
- comprobante opcional;
- registrado por;
- saldo;
- estado.

Profesor ve únicamente sus liquidaciones.

---

# 23. Solicitudes y autorizaciones

Crear centro de solicitudes y notificaciones internas.

Tipos MVP:

```text
capacity_override
attendance_correction
discount_approval
payment_reversal
payment_confirmation
enrollment_cancellation
student_status_change
settlement_reopen
qr_access_override
other
```

Estados:

```text
pending
approved
rejected
cancelled
expired
```

Campos:

- workspace;
- academy;
- sede;
- solicitante;
- tipo;
- entidad;
- valor anterior;
- valor propuesto;
- motivo;
- prioridad;
- propietario resolutor;
- resolución;
- comentario;
- timestamps.

La interfaz del propietario debe mostrar:

- contador;
- lista;
- filtros;
- detalle;
- aprobar;
- rechazar;
- comentario;
- vínculo a entidad.

No permitir autoaprobar una solicitud propia cuando la política requiera otro actor.

---

# 24. Centro de notificaciones

Notificaciones in-app para:

- solicitud nueva;
- solicitud resuelta;
- check-in rechazado;
- check-in con advertencia;
- pago registrado;
- pago pendiente de validar;
- transferencia rechazada;
- cuota vencida;
- comisión próxima a llenarse;
- asistencia pendiente de cerrar;
- liquidación lista;
- liquidación cerrada;
- pago a profesor;
- workspace suspendido;
- alerta crítica;
- importación finalizada;
- informe disponible.

Campos:

- destinatario;
- tipo;
- título;
- cuerpo;
- vínculo;
- severidad;
- leído;
- timestamps.

Implementar bandeja y campana.

---

# 25. Correo electrónico

Eventos MVP:

- invitación de usuario;
- recuperación de contraseña;
- alumno registrado, cuando tenga email;
- inscripción confirmada;
- comisión asignada;
- cuota generada;
- vencimiento próximo;
- cuota vencida;
- pago confirmado;
- comprobante disponible;
- clase suspendida o reprogramada;
- solicitud resuelta;
- liquidación docente cerrada;
- pago docente registrado;
- informe mensual disponible.

Todas las plantillas deben ser editables a nivel plataforma o academia en una versión simple.

No fallar una transacción financiera porque el proveedor de correo esté caído. Usar outbox transaccional y reintento.

---

# 26. Alertas y mitigación de fraude

Tabla `alerts`.

Severidades:

```text
info
low
medium
high
critical
```

Estados:

```text
new
under_review
resolved
dismissed
```

Alertas automáticas:

- intento de acceso QR inválido;
- persona sin inscripción;
- alumno abandonado intentando ingresar;
- comisión sin cupo;
- inscripción por encima del cupo;
- asistencia registrada fuera de ventana;
- correcciones reiteradas de asistencia;
- pago retroactivo;
- transferencia sin referencia cuando sea obligatoria;
- pago revertido después de cierre;
- alumno activo sin cuotas;
- alumno marcado presente sin inscripción elegible;
- cambio de porcentaje;
- liquidación con inconsistencia;
- check-ins reiterados rechazados;
- descuento extraordinario;
- usuario intentando acceder a otra academia;
- múltiples fallos de autorización;
- workspace suspendido con intento operativo;
- cobro por fuera denunciado.

Crear `incidents` para registro manual:

- cobro externo denunciado;
- persona no autorizada;
- uso indebido de sede;
- irregularidad de asistencia;
- irregularidad de pago;
- otro.

Campos:

- descripción;
- involucrados;
- evidencia opcional;
- estado;
- responsable;
- resolución;
- timestamps.

---

# 27. Auditoría completa

Tabla `audit_logs` append-only.

Registrar:

- actor;
- rol;
- workspace;
- academia;
- sede;
- acción;
- entidad;
- entidad ID;
- valor anterior;
- valor posterior;
- metadata;
- motivo;
- solicitud;
- fecha;
- IP cuando esté disponible;
- user agent;
- request ID;
- correlation ID;
- origen: web, RPC, job, importación, soporte.

Acciones mínimas:

- login;
- logout;
- acceso denegado;
- creación y desactivación de usuarios;
- cambio de membresía;
- cambio de estado del workspace;
- modo soporte;
- alta y edición de alumno;
- cambio de DNI;
- inscripción;
- abandono;
- generación y cancelación de cuota;
- pago;
- confirmación;
- rechazo;
- reversión;
- recibo;
- caja;
- check-in;
- asistencia;
- solicitud;
- aprobación;
- cambio de cupo;
- cambio de porcentaje;
- cierre;
- reapertura;
- pago a profesor;
- descarga de archivo sensible;
- exportación;
- importación.

Políticas:

- usuarios normales: no insertan directamente logs arbitrarios;
- nadie puede actualizar ni eliminar logs;
- superadmin consulta global;
- propietario consulta solo su workspace;
- recepcionista acceso limitado;
- profesor ve únicamente auditoría relevante a sus acciones cuando sea necesario.

Crear exportación filtrada.

Implementar triggers y logs explícitos donde corresponda. Documentar qué capa captura cada acción.

---

# 28. Informes y estadísticas

## Dashboard de plataforma

- clientes activos;
- clientes suspendidos;
- academias;
- usuarios;
- alumnos;
- volumen de pagos registrado;
- uso por cliente;
- alertas críticas;
- próximos vencimientos manuales del servicio;
- actividad reciente.

## Dashboard del propietario

- academias y sedes;
- alumnos activos;
- comisiones activas;
- ocupación;
- clases del día;
- check-ins;
- cuotas del mes;
- cobrado;
- deuda;
- pagos pendientes de validar;
- caja abierta;
- liquidación estimada;
- liquidaciones pendientes;
- pagos docentes pendientes;
- solicitudes;
- alertas;
- deserción;
- recaudación por academia, sede, curso y comisión.

## Dashboard de recepción

- sede activa;
- clases del día;
- escáner QR;
- alumnos esperados;
- check-ins;
- pagos del día;
- transferencias pendientes;
- caja;
- solicitudes;
- alertas operativas.

## Dashboard del profesor

- próxima clase;
- comisiones;
- asistencia pendiente;
- alumnos oficiales;
- solicitudes;
- estimación de comisión;
- liquidaciones;
- pagos recibidos;
- avisos.

## Informes descargables

- alumnos;
- inscripciones;
- alumnos por estado;
- abandono;
- ocupación;
- clases;
- asistencia;
- check-ins;
- intentos rechazados;
- cargos;
- deuda;
- pagos;
- pagos por medio;
- caja;
- descuentos;
- comisión docente;
- liquidaciones;
- pagos docentes;
- solicitudes;
- alertas;
- incidentes;
- auditoría.

Formatos:

- CSV;
- XLSX;
- PDF.

Nunca generar un archivo con datos de otro tenant.

---

# 29. Resumen mensual PDF

Implementar un informe mensual persistente por academia y uno consolidado por workspace.

Secciones:

1. portada;
2. academia y período;
3. resumen ejecutivo;
4. alumnos activos;
5. altas;
6. bajas y abandonos;
7. comisiones;
8. ocupación;
9. clases;
10. asistencia;
11. check-ins;
12. accesos rechazados;
13. cuotas generadas;
14. recaudación;
15. deuda;
16. pagos por medio;
17. señas y parciales;
18. liquidaciones docentes;
19. pagos docentes;
20. caja;
21. descuentos;
22. solicitudes;
23. alertas;
24. incidentes;
25. acciones de usuarios;
26. anexos y notas.

Guardar:

- período;
- versión;
- filtros;
- generado por;
- generado en;
- archivo R2;
- hash;
- estado.

Permitir descargar meses anteriores.

Si se regenera, conservar versiones o registrar reemplazo.

---

# 30. Exportación e importación

## Exportación

Permitir exportar con filtros y auditoría.

Para datos sensibles:

- confirmación reforzada;
- registrar actor;
- registrar cantidad de filas;
- archivo privado;
- URL temporal;
- expiración.

## Importación CSV/XLSX

MVP:

- alumnos;
- cursos;
- comisiones;
- inscripciones;
- saldos/cargos iniciales opcionales.

Flujo:

1. descargar plantilla;
2. subir;
3. parsear;
4. vista previa;
5. validar;
6. detectar duplicados;
7. mostrar errores por fila;
8. confirmar;
9. ejecutar transaccionalmente o por lotes controlados;
10. generar reporte;
11. auditar;
12. permitir revertir lote únicamente antes de movimientos posteriores y sin borrar registros críticos; preferir marcar importación revertida y desactivar entidades creadas.

Nunca importar directamente sin previsualización.

---

# 31. Interfaz y experiencia de usuario

Tecnologías:

- Tailwind CSS;
- shadcn/ui o componentes accesibles equivalentes;
- Lucide Icons;
- React Hook Form;
- Zod;
- tablas con paginación;
- gráficos accesibles;
- no especificar una paleta rígida incompatible con branding.

Principios:

- mobile-first para todos;
- navegación inferior o menú compacto en móvil;
- sidebar en escritorio;
- objetivos táctiles grandes;
- formularios por pasos cuando sean largos;
- validación inmediata;
- mensajes comprensibles;
- skeletons;
- estados vacíos;
- errores recuperables;
- confirmación reforzada en acciones críticas;
- no saturar;
- ocultar complejidad financiera que el rol no necesita;
- español rioplatense neutro;
- formato de moneda y fecha local;
- accesibilidad de teclado;
- contraste adecuado;
- labels visibles;
- no depender solo del color;
- indicador de academia y sede activas;
- banner de modo soporte;
- banner de workspace suspendido;
- responsive desde 360 px.

Páginas mínimas:

```text
/login
/forgot-password
/select-context

/platform
/platform/workspaces
/platform/workspaces/[id]
/platform/users
/platform/audit
/platform/settings

/app
/app/dashboard
/app/academies
/app/branches
/app/users
/app/students
/app/students/[id]
/app/courses
/app/cohorts
/app/cohorts/[id]
/app/classes
/app/attendance
/app/check-in
/app/enrollments
/app/charges
/app/payments
/app/cash
/app/settlements
/app/instructor-payouts
/app/requests
/app/alerts
/app/incidents
/app/notifications
/app/reports
/app/imports
/app/audit
/app/settings

/instructor
/instructor/dashboard
/instructor/cohorts
/instructor/classes
/instructor/attendance
/instructor/settlements
/instructor/notifications
```

Adaptar rutas al diseño final sin perder módulos.

---

# 32. Modelo de datos mínimo

Crear migraciones para las tablas necesarias. Nombres sugeridos, ajustables con justificación:

```text
profiles
platform_admins
workspaces
workspace_service_status
workspace_memberships
academies
academy_settings
academy_branding
academy_memberships
branches
branch_memberships
user_invitations
support_sessions

students
student_guardians
instructor_profiles

courses
cohorts
cohort_instructors
enrollments
class_sessions
attendance_records

qr_credentials
checkins

charges
payments
payment_allocations
payment_receipts
cash_sessions
cash_movements

commission_rules
commission_rule_versions
settlement_periods
instructor_settlements
settlement_items
settlement_adjustments
instructor_payouts

approval_requests
notifications
notification_templates
notification_outbox
notification_attempts

alerts
incidents
audit_logs

report_runs
report_files
import_batches
import_rows
feature_flags
```

Crear índices para:

- tenancy;
- DNI;
- estado;
- fechas;
- búsquedas;
- relaciones;
- períodos;
- vencimientos;
- check-in;
- auditoría;
- outbox;
- alertas.

Agregar constraints:

- montos no negativos;
- porcentajes entre 0 y 100;
- cupo positivo;
- asignaciones no excedidas;
- unicidad tenant-aware;
- fechas coherentes;
- una caja abierta;
- un check-in por alumno/clase;
- un registro de asistencia por inscripción/clase;
- cierres únicos por período/profesor/comisión;
- claves foráneas consistentes con el tenant, mediante claves compuestas, triggers o RPC de validación.

---

# 33. Seguridad

Implementar y documentar:

- RLS por workspace;
- permisos por rol y alcance;
- protección contra IDOR;
- validación Zod;
- límites de archivo;
- MIME sniffing seguro;
- sanitización;
- rate limiting de login, QR y endpoints críticos;
- CSP razonable;
- headers de seguridad;
- CSRF según patrón de Next.js;
- cookies seguras;
- no filtrar secretos;
- no registrar contraseñas ni tokens;
- enmascarar DNI y datos sensibles en logs;
- URLs firmadas cortas;
- revocación;
- protección de exportaciones;
- idempotencia;
- transacciones;
- controles de concurrencia;
- auditoría;
- permisos de soporte;
- bloqueo por workspace suspendido.

Crear una matriz de permisos en `docs/SECURITY.md`.

Ejecutar pruebas específicas para demostrar aislamiento multi-tenant.

---

# 34. Operaciones financieras transaccionales

Implementar funciones/RPC atómicas para:

- crear inscripción y reservar cupo;
- generar cuotas;
- registrar pago;
- confirmar transferencia;
- asignar pago;
- revertir pago;
- abrir/cerrar caja;
- calcular comisión estimada;
- cerrar liquidación;
- registrar pago docente;
- crear check-in;
- aprobar solicitud crítica.

Cada función debe:

- validar actor;
- validar tenant;
- validar estado;
- usar lock o constraint cuando haya riesgo de carrera;
- ser idempotente;
- devolver error de dominio entendible;
- auditar.

No implementar lógica financiera crítica exclusivamente en componentes React.

---

# 35. Trabajos programados

Preparar tareas para:

- marcar cuotas vencidas;
- enviar recordatorios;
- procesar outbox;
- reintentar correo;
- generar alertas;
- preparar informe mensual;
- limpiar archivos temporales;
- expirar URLs o registros temporales;
- verificar consistencia.

Implementar comandos/scripts ejecutables y endpoints internos autenticados para cron.

Documentar configuración en Render. Si no hay credenciales, permitir ejecución manual local.

---

# 36. Datos de demostración

Crear seed idempotente con:

## Plataforma

- un superadministrador.

## Cliente 1

- workspace activo;
- propietario;
- dos academias;
- tres sedes;
- dos recepcionistas;
- tres profesores;
- cursos;
- seis comisiones;
- al menos treinta alumnos;
- menores con tutor;
- inscripciones;
- cupo completo;
- solicitud de excepción;
- cuotas;
- señas;
- pagos parciales;
- transferencias pendientes;
- pagos confirmados;
- pagos revertidos;
- caja abierta y cerrada;
- clases;
- asistencias;
- QR;
- check-ins verdes, amarillos y rojos;
- abandonos;
- alertas;
- liquidación abierta;
- liquidación cerrada;
- pago docente parcial;
- notificaciones;
- auditoría.

## Cliente 2

- workspace separado;
- una academia;
- una sede;
- usuarios y alumnos distintos.

Las pruebas deben demostrar que Cliente 1 no puede ver Cliente 2.

No guardar contraseñas reales en Git. Documentar credenciales demo locales generadas por script.

---

# 37. Pruebas

## Unitarias

- cálculos monetarios;
- porcentajes;
- descuentos;
- estado de cuota;
- elegibilidad comisionable;
- política QR;
- ventanas de asistencia;
- permisos;
- formateo;
- validaciones.

## Integración

- inscripción;
- cupo;
- cuotas;
- pagos parciales;
- confirmación;
- reversión;
- caja;
- check-in;
- asistencia;
- solicitudes;
- liquidación;
- pago docente;
- informe;
- outbox.

## Base de datos/RLS

Escenarios obligatorios:

1. usuario sin membresía intenta leer workspace;
2. propietario intenta leer otro workspace;
3. recepcionista accede a otra academia;
4. profesor accede a otro grupo;
5. profesor intenta crear alumno;
6. profesor intenta registrar pago;
7. usuario suspendido opera;
8. superadmin accede legítimamente;
9. modo soporte queda auditado;
10. nadie actualiza/elimina auditoría.

## E2E con Playwright

1. superadmin crea un cliente;
2. invita propietario;
3. propietario crea academia y sede;
4. crea recepcionista y profesor;
5. crea curso y comisión;
6. crea alumno menor con tutor;
7. inscribe alumno;
8. genera cuotas;
9. registra seña;
10. confirma pago;
11. abre caja;
12. registra efectivo;
13. escanea QR autorizado;
14. escanea QR con deuda;
15. rechaza QR sin inscripción;
16. profesor registra asistencia;
17. solicita corrección tardía;
18. propietario aprueba;
19. alumno abandona;
20. cuotas futuras se cancelan;
21. se calcula liquidación;
22. se cierra;
23. se registra pago docente;
24. se genera PDF mensual;
25. se exporta auditoría;
26. otro tenant no puede ver datos.

## Calidad

Ejecutar:

- lint;
- typecheck;
- test;
- build;
- E2E;
- análisis de migraciones;
- búsqueda de secretos;
- verificación de `.env.example`.

Corregir todos los errores antes de marcar finalizado.

---

# 38. Observabilidad y errores

Implementar:

- logger estructurado;
- request/correlation ID;
- manejo de errores de dominio;
- página de error;
- health endpoint;
- readiness;
- logs sin datos sensibles;
- integración opcional con proveedor externo mediante adaptador;
- registro de fallos de jobs;
- panel o vista básica de outbox fallida para superadmin/propietario según alcance.

No ocultar errores con respuestas genéricas cuando el usuario necesita corregir un dato, pero no exponer SQL ni stack traces en producción.

---

# 39. Despliegue

Entregar:

- `Dockerfile`;
- `.dockerignore`;
- `render.yaml`;
- comandos de build/start;
- health check;
- migraciones;
- seed;
- variables;
- configuración de dominio;
- configuración Cloudflare DNS;
- configuración R2;
- CORS de R2;
- claves de acceso con privilegio mínimo;
- Supabase redirect URLs;
- SMTP;
- cron/jobs;
- backups;
- rollback.

Variables sugeridas:

```text
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_DB_URL

R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_PRIVATE
R2_ENDPOINT
R2_PUBLIC_BASE_URL_OPTIONAL

SMTP_HOST
SMTP_PORT
SMTP_SECURE
SMTP_USER
SMTP_PASSWORD
EMAIL_FROM

APP_ENCRYPTION_KEY
QR_TOKEN_PEPPER
CRON_SECRET
LOG_LEVEL
```

No asumir valores reales.

---

# 40. Fases de ejecución y TODO

Creá `TODO.md` usando este orden.

## Fase 0 — Inspección

- [ ] inspeccionar repositorio;
- [ ] detectar código existente;
- [ ] registrar restricciones;
- [ ] definir versiones;
- [ ] crear documentación inicial;
- [ ] crear plan.

## Fase 1 — Base técnica

- [ ] inicializar Next.js/TypeScript;
- [ ] configurar lint/format/typecheck;
- [ ] Tailwind/componentes;
- [ ] Docker;
- [ ] Render;
- [ ] Supabase CLI;
- [ ] variables;
- [ ] CI.

## Fase 2 — Esquema multi-tenant

- [ ] migraciones;
- [ ] funciones de autorización;
- [ ] RLS;
- [ ] índices;
- [ ] constraints;
- [ ] auditoría;
- [ ] seeds;
- [ ] pruebas de aislamiento.

## Fase 3 — Auth y plataforma

- [ ] login;
- [ ] invitaciones;
- [ ] superadmin;
- [ ] clientes;
- [ ] suspensión;
- [ ] propietarios;
- [ ] academias;
- [ ] sedes;
- [ ] membresías;
- [ ] soporte auditado.

## Fase 4 — Alumnos

- [ ] CRUD seguro;
- [ ] DNI único;
- [ ] tutores;
- [ ] foto opcional R2;
- [ ] estados;
- [ ] historial;
- [ ] filtros;
- [ ] exportación.

## Fase 5 — Cursos y comisiones

- [ ] cursos;
- [ ] comisiones;
- [ ] cupos;
- [ ] calendario;
- [ ] clases;
- [ ] profesores;
- [ ] porcentajes;
- [ ] dashboards.

## Fase 6 — Inscripciones y cargos

- [ ] inscripción transaccional;
- [ ] cupo;
- [ ] cuotas;
- [ ] descuentos simples;
- [ ] señas;
- [ ] abandono;
- [ ] cancelación de futuras;
- [ ] deuda vencida.

## Fase 7 — Pagos y caja

- [ ] pagos;
- [ ] asignaciones;
- [ ] parciales;
- [ ] confirmación;
- [ ] reversión;
- [ ] comprobante;
- [ ] caja simple;
- [ ] PDF;
- [ ] correo.

## Fase 8 — QR

- [ ] emisión;
- [ ] revocación;
- [ ] impresión;
- [ ] escáner;
- [ ] políticas;
- [ ] verde/amarillo/rojo;
- [ ] override;
- [ ] alertas;
- [ ] auditoría;
- [ ] pruebas.

## Fase 9 — Asistencia

- [ ] nómina cerrada;
- [ ] ventana;
- [ ] check-in sugerido;
- [ ] cierre;
- [ ] solicitudes;
- [ ] corrección;
- [ ] informes.

## Fase 10 — Liquidaciones

- [ ] reglas;
- [ ] versiones;
- [ ] estimación;
- [ ] cierre mensual;
- [ ] snapshot;
- [ ] ajustes;
- [ ] PDF;
- [ ] pago docente;
- [ ] vista profesor.

## Fase 11 — Alertas y notificaciones

- [ ] centro in-app;
- [ ] outbox;
- [ ] SMTP;
- [ ] reintentos;
- [ ] alertas automáticas;
- [ ] incidentes;
- [ ] WhatsApp futuro.

## Fase 12 — Informes

- [ ] dashboards;
- [ ] CSV;
- [ ] XLSX;
- [ ] PDF;
- [ ] resumen mensual;
- [ ] historial;
- [ ] almacenamiento R2.

## Fase 13 — Importación

- [ ] plantillas;
- [ ] parsing;
- [ ] preview;
- [ ] validación;
- [ ] lotes;
- [ ] reporte;
- [ ] auditoría.

## Fase 14 — QA y seguridad

- [ ] unit;
- [ ] integración;
- [ ] RLS;
- [ ] E2E;
- [ ] rate limiting;
- [ ] headers;
- [ ] archivos;
- [ ] concurrencia;
- [ ] idempotencia;
- [ ] auditoría;
- [ ] build.

## Fase 15 — Producción y documentación

- [ ] deployment;
- [ ] setup;
- [ ] backup;
- [ ] rollback;
- [ ] manual;
- [ ] demo;
- [ ] changelog;
- [ ] revisión final.

---

# 41. Criterios de aceptación

El proyecto solo se considera listo cuando:

1. puede ejecutarse localmente con instrucciones reproducibles;
2. puede desplegarse en Render;
3. las migraciones crean el esquema;
4. existe seed demostrativo;
5. los roles funcionan;
6. el aislamiento multi-tenant está probado;
7. un owner puede manejar varias academias;
8. dos clientes no chocan;
9. el superadmin puede suspender un cliente;
10. una recepcionista puede registrar alumnos, pagos y check-ins;
11. un profesor no puede crear alumnos ni pagos;
12. el cupo se respeta;
13. una inscripción genera cuotas;
14. se permiten señas y parciales;
15. las transferencias pueden validarse;
16. los pagos confirmados reducen deuda;
17. los pagos externos no existen para la liquidación;
18. el QR no contiene datos sensibles;
19. un QR sin inscripción es rechazado;
20. la política de deuda es configurable;
21. el check-in queda auditado;
22. la asistencia usa nómina cerrada;
23. el abandono cancela futuras y conserva vencidas;
24. la comisión docente usa pagos elegibles;
25. el cierre congela un snapshot;
26. se registra pago docente;
27. se generan comprobantes internos;
28. existe caja simple;
29. existen solicitudes;
30. existen alertas;
31. existe auditoría append-only;
32. hay exportación CSV/XLSX/PDF;
33. existe informe mensual PDF;
34. el correo usa outbox;
35. WhatsApp queda desacoplado;
36. los archivos privados usan R2 con acceso temporal;
37. lint, typecheck, tests y build pasan;
38. la documentación es suficiente para continuar el desarrollo.

---

# 42. Restricciones de alcance

No implementar ahora:

- portal autenticado del alumno;
- campus virtual;
- evaluaciones académicas completas;
- certificados;
- reconocimiento facial;
- fotografía del aula;
- facturación fiscal;
- cobro automático de suscripciones SaaS;
- contabilidad completa;
- nómina laboral;
- profesores suplentes complejos;
- reincorporación automatizada;
- becas o promociones avanzadas;
- WhatsApp real;
- aplicación móvil nativa;
- soporte offline real.

Preparar puntos de extensión sin mostrar módulos falsos o incompletos al usuario.

---

# 43. Reglas de autonomía del agente

- No pedir confirmación para decisiones reversibles.
- No reemplazar implementación por pseudocódigo.
- No dejar TODO críticos sin resolver.
- No afirmar que una integración funciona sin probarla.
- No inventar credenciales.
- No desactivar seguridad para que pase una demo.
- No usar datos de producción en seeds.
- No saltarse RLS.
- No esconder errores de TypeScript.
- No terminar con pruebas fallidas.
- Cuando una librería no sea viable, elegir otra estable y documentar.
- Usar versiones estables compatibles y fijarlas en lockfile.
- Hacer commits lógicos si el entorno lo permite.
- Mantener el repositorio limpio.
- Priorizar funcionalidad completa y segura sobre animaciones.
- Continuar con la siguiente fase mientras queden tareas posibles.

---

# 44. Entrega final esperada

Al finalizar, producir un resumen en:

```text
FINAL_REPORT.md
```

Debe incluir:

- qué se construyó;
- arquitectura;
- módulos;
- decisiones;
- migraciones;
- cuentas demo;
- cómo ejecutar;
- cómo probar;
- cómo desplegar;
- variables faltantes;
- limitaciones reales;
- riesgos pendientes;
- lista de pruebas y resultado;
- checklist de producción;
- próximos pasos para certificados, portal del alumno y WhatsApp.

También mostrar en la respuesta final:

1. estado general;
2. comandos exactos;
3. URL local;
4. cuentas demo;
5. pruebas ejecutadas;
6. cualquier bloqueo externo;
7. ubicación de la documentación.

Comenzá ahora por inspeccionar el repositorio y crear `TODO.md`. Después avanzá fase por fase sin detenerte hasta completar todo lo posible.
