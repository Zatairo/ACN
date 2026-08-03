# PLAN LMS — Aula Virtual Interna de ACN Institute

> Versión: 1.0 · 2026-08-02 · Autor: Directora Ejecutiva (agente director)
> Alcance: construcción del AULA VIRTUAL INTERNA (LMS) sobre la app de `web/`.
> Restricción NO negociable: **NO se publica en producción** en Fases 1–4. La Fase 5 es SOLO planificación, sin fechas de ejecución.

---

## 0. Hallazgo crítico previo (leer antes de ejecutar)

La documentación raíz (`AGENTS.md`, `ops/ESTADO DEL PROYECTO.md`) describe `web/` como una app **Next.js 16 (App Router, TS)**. La realidad verificada en disco (2026-08-02):

| Verificación | Resultado |
|---|---|
| `web/package.json` | Vite 6 + React 18.2 + React Router 6 + Tailwind 3 + shadcn/ui (`"name": "us-learn"`) |
| `web/node_modules/next` | NO existe |
| `web/app/` o `web/src/app/` (App Router) | NO existe |
| `web/next.config.js` | NO existe |
| Backend | `src/api/base44Client.js`: API local simulada (auth + entidades Lesson/StudentProfile + LLM/imágenes) sobre `localStorage` (claves `uslearn_*`) |
| Frontend actual | Landing, Login/Register, Onboarding (perfil + nivelación), Dashboard, Profile, MyLessons, LessonView, AdminSettings, actividades (FillInBlanks, WordSearch) |

**Decisión de diseño D0 (verificación de stack):** la Fase 1 arranca con una tarea de confirmación de stack con doble vía:

- **Vía A (RECOMENDADA):** construir el LMS sobre la app Vite existente + un servidor API local en Node (Express/Fastify) con SQLite + Prisma, alojado en `web/server/`. Reutiliza ~80% del código actual (auth, RAG, motor de lecciones, actividades) y evita una reescritura total.
- **Vía B (alternativa documentada):** migrar a Next.js 16 (App Router). Solo se justifica si el destino de producción requiere SSR/SEO fuerte. Implica reescribir routing, data fetching y auth; retrasa la Fase 4 varias semanas.

El modelo de datos y el contrato REST de este plan son **agnósticos del stack**: sirven igual en ambas vías. La vía se confirma en la tarea F1.A1 y no bloquea el resto de la Fase 1.

---

## FASE 1 — Modelo de datos + backend básico

**Objetivo:** definir el esquema completo del LMS, la persistencia y el contrato de API sobre el que se construyen los módulos.

### Épica F1.A — Verificación de stack y bootstrap del backend

| Tarea | Responsable | Prioridad | Depende de |
|---|---|---|---|
| Confirmar stack real (Vite+React) y decidir Vía A o Vía B con la directora; documentar la decisión en `docs/ARQUITECTURA.md` | director + webdev | Alta | — |
| Instalar en `web/` las dependencias del backend: `prisma`, `@prisma/client`, `express` (o `fastify`), `zod`, `bcryptjs`, `jsonwebtoken`, `cors` | webdev | Alta | F1.A1 |
| Inicializar Prisma con provider `sqlite` (archivo `web/prisma/schema.prisma`, base `web/data/lms.db` fuera de git) | webdev | Alta | F1.A2 |
| Configurar proxy de desarrollo en `vite.config.js` para que `/api/*` del frontend apunte al servidor local (puerto 4000) | webdev | Alta | F1.A2 |
| Crear servidor Express mínimo (`web/server/index.js`) con `/api/health`, CORS y manejo de errores centralizado | webdev | Alta | F1.A2 |
| Crear script `npm run dev:api` y `npm run dev:all` (API + Vite con concurrently) | webdev | Media | F1.A5 |

### Épica F1.B — Justificación de persistencia

**Decisión: SQLite + Prisma** para desarrollo local.

| Criterio | SQLite + Prisma | PostgreSQL (checklist) | localStorage (actual) |
|---|---|---|---|
| Infraestructura | Cero (archivo local) | Docker/servicio obligatorio | Cero |
| Compartido entre roles/dispositivos | Sí | Sí | NO (por navegador) |
| Migraciones versionadas + tipos TS | Sí (Prisma) | Sí (Prisma) | No |
| Consistencia y transacciones | Sí | Sí | No |
| Volumen requerido (6 estudiantes, ~15 clases/semana, 2026) | Sobra | Sobra | — |
| Migración futura a producción | `provider = "postgresql"` sin tocar el esquema | N/A | Reescritura total |

Justificación corta: cero costo y cero DevOps para una operación de una persona; Prisma genera tipos TypeScript y migraciones versionadas que aceleran Fases 2–3; el cambio a PostgreSQL en Fase 5 es solo cambiar el provider y la cadena de conexión. El `localStorage` actual queda descartado como persistencia del LMS porque no se comparte entre estudiante/profesor/admin y no puede registrar pagos, agenda ni auditoría de forma confiable.

### Épica F1.C — Entidades y campos clave (esquema Prisma)

| # | Entidad | Campos clave | Notas / mapeo con lo existente |
|---|---|---|---|
| 1 | `User` | id, email (único), passwordHash, nombre, telefonoWhatsApp, rol (`STUDENT\|TEACHER\|ADMIN`), estado (`ACTIVE\|INACTIVE\|SUSPENDED`), createdAt, updatedAt | Mapea a `uslearn_users`; la profesora/directora será el `ADMIN` + `TEACHER` |
| 2 | `StudentProfile` (RAG) | id, userId (1:1), nivelMCER (`A1..C1`), proposito, industria/profesion, intereses, contextoProfesional, objetivo, horariosPreferidos, notasDocente, datosRAG (JSON: intereses, vocabulario clave, restricciones), updatedAt | Mapea a `uslearn_profiles` y `StudentProfile`; alimenta el motor de lecciones |
| 3 | `Course` | id, titulo, nivelMCER, descripcion, modalidad, estado (`DRAFT\|ACTIVE\|ARCHIVED`), teacherId, paqueteId opcional | 6 cursos iniciales = 1 por estudiante (personalizados) |
| 4 | `Module` | id, courseId, orden, titulo, descripcion, estado | Unidades dentro del curso (checklist sección 6) |
| 5 | `Enrollment` | id, studentId, courseId, paqueteId, fechaInicio, fechaFin, sesionesContratadas, sesionesUsadas, estado (`ACTIVE\|PAUSED\|FINISHED\|CANCELLED`), precioCOP | Controla paquetes y clases restantes |
| 6 | `Session` | id, enrollmentId, teacherId, fechaHora, duracionMin (45), estado (`SCHEDULED\|COMPLETED\|CANCELLED\|RESCHEDULED\|NO_SHOW`), enlaceVideo, tema, notasClase, asistio, creadaPor (`PROFESORA\|ESTUDIANTE\|SISTEMA`) | Núcleo de la agenda; franjas L–S 7am/12pm/5pm COL |
| 7 | `Task` | id, courseId, studentId, teacherId, tipo (`CONVERSACION\|ESCRITURA\|LECTURA\|LISTENING\|VOCABULARIO\|EXAMEN`), titulo, descripcion, nivelMCER, fechaLimite, estado (`ASSIGNED\|SUBMITTED\|GRADED\|EXPIRED`), audioUrl (ElevenLabs) | Conversación guiada = plantilla de tarea principal |
| 8 | `Submission` | id, taskId, studentId, contenidoTexto, archivoUrl, audioUrl, fechaEntrega, estado | Entrega del estudiante |
| 9 | `Grade` | id, taskId, submissionId, nota (0–100), rubricaJson, feedback (texto/audio), evaluadoPor, fechaEvaluacion | Rúbricas MCER "can-do" |
| 10 | `Package` | id, nombre (Básico, Semi Intensivo, Bimestral, Semi Intensivo Plus, Trimestral), sesiones, vigenciaDias, precioCOP, precioPorClase | Fuente única de precios (`Services- Andres.docx`) |
| 11 | `Payment` | id, studentId, enrollmentId, concepto, valorCOP, metodo (`NEQUI\|DAVIVIENDA\|WOMPI_CARD\|WOMPI_NEQUI\|WOMPI_PSE\|EFECTIVO`), estado (`PENDIENTE\|APROBADO\|RECHAZADO\|REEMBOLSADO\|VENCIDO`), fecha, referencia, transaccionIdWompi, comprobanteUrl | Transición manual (comprobante) → Wompi en Fase 3 |
| 12 | `PracticeActivity` | id, courseId, taskId opcional, tipo (`FILL_BLANKS\|WORD_SEARCH\|QUIZ\|LISTENING\|GUIDED_CONVERSATION\|ROLE_PLAY`), contenidoJson, audioUrl, nivelMCER, estado | Reutiliza FillInBlanks/WordSearch existentes |
| 13 | `Resource` | id, courseId, moduleId opcional, tipo (`PDF\|LINK\|AUDIO\|VIDEO\|DOC`), titulo, url, uploaderId, createdAt | Material de estudio por curso |
| 14 | `Message` | id, remitenteId, destinatarioId, tipo (`MENSAJE\|RECORDATORIO\|ANUNCIO`), contenido, leido, fecha | Mensajería interna + notificaciones |
| 15 | `Lead` | id, nombre, telefonoWhatsApp, canal (`WEB\|IG\|TIKTOK\|FOLLETO\|REFERIDO`), estado (`NUEVO\|CONTACTADO\|DIAGNOSTICO\|OFERTA\|CERRADO\|PERDIDO`), nivelEstimado, notas, fecha | CRM interno (checklist sección 10) |
| 16 | `AuditLog` | id, userId, accion, entidad, entidadId, fecha | Trazabilidad admin |

Nota: los precios/paquetes se toman de `Services- Andres.docx` (estrategia comercial: Básico $360.000, Semi Intensivo $510.000, Bimestral $680.000, Semi Plus $990.000, Trimestral $1.350.000).

### Épica F1.D — APIs (route handlers) necesarias

Contrato REST `/api/*`. **Si se confirma la Vía B (Next.js 16),** cada endpoint se implementa como Route Handler en `app/api/**/route.ts`; **si se confirma la Vía A (recomendada),** como rutas del servidor Express en `web/server/`. La lista de endpoints es idéntica en ambos casos.

| Módulo | Endpoints | Autenticación |
|---|---|---|
| Auth | `POST /api/auth/register` · `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me` · `POST /api/auth/reset-password` | Pública / JWT |
| Usuarios | `GET/POST /api/users` · `PATCH/DELETE /api/users/:id` (roles y estados) | ADMIN |
| Perfiles RAG | `GET/PUT /api/students/:id/profile` · `POST /api/students/:id/level-test` | STUDENT + TEACHER |
| Cursos | `GET/POST /api/courses` · `GET/PATCH /api/courses/:id` · `GET/POST /api/courses/:id/modules` | TEACHER/ADMIN |
| Matrículas | `GET/POST /api/enrollments` · `PATCH /api/enrollments/:id` (pausar/cerrar, consumir sesiones) | ADMIN |
| Sesiones | `GET /api/sessions?from&to` · `POST /api/sessions` · `PATCH /api/sessions/:id` (asistencia, enlace, reprogramación) · `POST /api/sessions/:id/cancel` | Roles según flujo |
| Tareas | `GET/POST /api/tasks` · `PATCH /api/tasks/:id` · `POST /api/tasks/:id/submissions` · `POST /api/tasks/:id/grades` | STUDENT/TEACHER |
| Paquetes | `GET /api/packages` · `PATCH /api/packages/:id` (precios) | ADMIN |
| Pagos | `GET /api/payments` · `POST /api/payments` (manual + comprobante) · `PATCH /api/payments/:id` (aprobar/rechazar) · `POST /api/payments/wompi/webhook` (Fase 3) | STUDENT/ADMIN |
| Prácticas | `GET /api/activities?courseId` · `POST /api/activities` · `GET/POST /api/activities/:id/attempts` (progreso) | STUDENT/TEACHER |
| Materiales | `GET/POST /api/resources` · `DELETE /api/resources/:id` | TEACHER/ADMIN |
| Mensajes | `GET /api/messages?with=userId` · `POST /api/messages` · `POST /api/messages/:id/read` | Autenticados |
| CRM | `GET/POST /api/leads` · `PATCH /api/leads/:id` (estado del funnel) | VENTAS/ADMIN |
| Reportes | `GET /api/reports/income` · `GET /api/reports/attendance` · `GET /api/reports/progress` | ADMIN |
| Integraciones | `GET /api/integrations/status` · `POST /api/integrations/calendly/webhook` · `POST /api/integrations/elevenlabs/generate` | ADMIN |

### Épica F1.E — Esquema, migración y seed

| Tarea | Responsable | Prioridad | Depende de |
|---|---|---|---|
| Escribir `schema.prisma` completo con las 16 entidades de la tabla F1.C (relaciones, índices, enums) | webdev | Alta | F1.A3 |
| Generar primera migración `prisma migrate dev --name init` y verificar `npm run lint` + `npm run build` | webdev | Alta | F1.E1 |
| Crear seed (`web/prisma/seed.ts`): usuarios (1 admin/teacher = Andrea, 6 estudiantes), perfiles RAG con datos reales (Andrés, Milena, Jenifer, Luciana, Nico&Juanita, Gabriela), paquetes y matrículas actuales | webdev + didactica | Alta | F1.E2 |
| Implementar middleware de auth JWT + guardas por rol (`requireAuth`, `requireRole('ADMIN'|'TEACHER'|'STUDENT')`) | webdev | Alta | F1.A5 |
| Implementar endpoints del módulo Auth (registro, login, me, reset) | webdev | Alta | F1.E4 |
| Implementar endpoints de Usuarios, Perfiles RAG y Paquetes | webdev | Alta | F1.E4 |
| Implementar endpoints de Cursos, Módulos y Matrículas | webdev | Alta | F1.E4 |
| Implementar endpoints de Sesiones (agenda + asistencia + reprogramación) | webdev | Alta | F1.E4 |
| Implementar endpoints de Tareas, Entregas y Notas (con rúbrica JSON) | webdev | Alta | F1.E4 |
| Implementar endpoints de Pagos (registro manual + comprobante + aprobación) | webdev | Alta | F1.E4 |
| Implementar endpoints de Prácticas, Recursos y Mensajes | webdev | Media | F1.E4 |
| Implementar endpoints de Leads (CRM) y Reportes (ingresos, asistencia, progreso) | webdev | Media | F1.E4 |
| Documentar en `docs/ARQUITECTURA.md`: esquema, endpoints, decisión de persistencia y de stack | webdev | Media | F1.E1–E4 |
| Prueba técnica de humo: levantar API + Vite, crear un usuario, una sesión y un pago de punta a punta con curl/Postman | webdev | Alta | F1.E5–E13 |

**Salida de Fase 1:** API local funcional contra SQLite, seed con los 6 estudiantes, contrato REST estable y documentado. Sin ninguna pantalla nueva aún.

---

## FASE 2 — Módulos estudiante / profesor / administrador

**Objetivo:** pantallas y flujos por rol dentro de la app (área privada). Cada pantalla se enlaza con las entidades de la Fase 1.

### Épica F2.A — Base compartida de la zona privada

| Tarea | Responsable | Prioridad | Depende de |
|---|---|---|---|
| Crear layout autenticado con sidebar por rol (estudiante/profesor/admin) y guardas de ruta por rol (redirige a `/login` y a su dashboard si no tiene permiso) | webdev | Alta | F1.E4 |
| Crear servicio cliente `src/api/lmsClient.js` (fetch con token JWT, manejo de errores, tipado de respuestas) que reemplace el uso directo de `base44Client` para datos del LMS | webdev | Alta | F1.D |
| Crear componente de estado global por rol: notificaciones no leídas y recordatorios de clase (polling ligero o refetch) | webdev | Media | F2.A2 |
| Definir textos de interfaz del LMS en los diccionarios i18n existentes (ES/EN) | contenido | Media | F2.A1 |

### Épica F2.B — Módulo estudiante

Rutas propuestas: `/estudiante` (dashboard), `/estudiante/clases`, `/estudiante/tareas`, `/estudiante/practicas`, `/estudiante/pagos`, `/estudiante/mensajes`, `/estudiante/perfil`.

| Pantalla | Entidades F1 que usa | Flujos clave | Tarea | Responsable | Prioridad | Depende de |
|---|---|---|---|---|---|---|
| Dashboard estudiante | Enrollment, Session, Task, Grade, Payment | Ver próxima clase, tareas pendientes, saldo de sesiones del paquete, nivel MCER | Crear dashboard con tarjetas: próxima clase, tareas pendientes, sesiones restantes, nivel/progreso | webdev | Alta | F2.A1 |
| Agenda de clases | Session, Enrollment | Ver próximas/recientes; solicitar reprogramación; unirse a la clase (enlace video) | Crear vista de agenda con historial y botón de enlace de reunión | webdev | Alta | F1.D (sessions) |
| Tareas | Task, Submission, Grade | Ver pendientes/entregadas/calificadas; entregar texto o subir archivo/audio; ver nota y feedback | Crear lista de tareas + detalle con formulario de entrega y vista de calificación | webdev | Alta | F1.D (tasks) |
| Prácticas | PracticeActivity, StudentProfile (RAG) | Realizar actividades interactivas (fill-blanks, wordsearch, quiz, listening) | Integrar las actividades existentes (FillInBlanks, WordSearch) alimentadas desde `PracticeActivity` + vistas nuevas (quiz, listening) | webdev + didactica | Alta | F2.B2, F2.B3 |
| Planes y pagos | Package, Payment, Enrollment | Ver paquete contratado y consumido; registrar pago manual (subir comprobante Nequi/Davivienda); ver historial | Crear página de pagos con subida de comprobante y estados | webdev | Alta | F1.D (payments) |
| Mensajes | Message | Conversar con la profesora | Crear chat simple con la profesora (por sesión/curso) | webdev | Media | F1.D (messages) |
| Mi perfil | StudentProfile (RAG) | Editar propósito, intereses, horarios; ver resultado de nivelación | Crear/editar perfil RAG reutilizando el Onboarding existente | webdev + didactica | Media | F2.A1 |

### Épica F2.C — Módulo profesor

Rutas propuestas: `/profesor` (dashboard), `/profesor/agenda`, `/profesor/estudiantes`, `/profesor/tareas`, `/profesor/materiales`, `/profesor/mensajes`.

| Pantalla | Entidades F1 que usa | Flujos clave | Tarea | Responsable | Prioridad | Depende de |
|---|---|---|---|---|---|---|
| Dashboard docente | Session, StudentProfile, Task | Ver clase siguiente, pendientes de calificar, alertas de pagos vencidos | Crear dashboard con agenda del día y alertas | webdev | Alta | F2.A1 |
| Agenda y sesiones | Session, Enrollment | Crear/cancelar/reprogramar sesiones; marcar asistencia; pegar enlace Meet/Zoom; notas de clase | Crear vista de agenda por semana con CRUD de sesiones y marcado de asistencia | webdev | Alta | F1.D (sessions) |
| Estudiantes | User, StudentProfile, Enrollment, Grade | Ver perfil RAG, nivel, progreso, historial de clases | Crear lista de estudiantes con ficha de progreso (nivel MCER + clases tomadas + notas) | webdev | Alta | F2.C2 |
| Tareas y calificaciones | Task, Submission, Grade | Crear/asignar tareas (plantilla conversación guiada, listening con audio); calificar con rúbrica y feedback | Crear módulo de tareas con calificación (nota + feedback texto/audio) | webdev + didactica | Alta | F1.D (tasks) |
| Materiales | Resource, Course | Subir PDFs/enlaces/audios por curso | Crear gestor de materiales por curso | webdev | Media | F2.A1 |
| Mensajes | Message | Responder a estudiantes | Chat con estudiantes (reutiliza F2.B6) | webdev | Media | F2.B6 |

### Épica F2.D — Módulo administrador

Rutas propuestas: `/admin` (dashboard), `/admin/usuarios`, `/admin/cursos`, `/admin/cobros`, `/admin/finanzas`, `/admin/crm`, `/admin/reportes`, `/admin/ajustes`.

| Pantalla | Entidades F1 que usa | Flujos clave | Tarea | Responsable | Prioridad | Depende de |
|---|---|---|---|---|---|---|
| Dashboard admin | Payment, Enrollment, Session, Lead | KPIs: estudiantes activos, ingresos del mes, mora, asistencia | Crear dashboard de KPIs (conecta a indicadores de `ops/ESTADO DEL PROYECTO.md`) | webdev | Alta | F2.A1 |
| Usuarios | User, StudentProfile | Crear/editar/desactivar usuarios; asignar roles | Crear panel de gestión de usuarios y roles | webdev | Alta | F1.D (users) |
| Cursos y paquetes | Course, Module, Package | CRUD de cursos, módulos y precios de paquetes | Crear panel de cursos/módulos/paquetes (precios fuente única) | webdev + finanzas | Alta | F1.D |
| Cobros | Payment, Enrollment, Package | Ver pagados/morosos; aprobar comprobantes; controlar vencimientos | Crear panel de cobros con aprobación de comprobantes y alertas de vencimiento | webdev + finanzas | Alta | F1.D (payments) |
| Finanzas | Payment, AuditLog | Ingresos por mes/método/paquete; conciliación con Nequi/Davivienda | Crear reporte financiero mensual exportable (CSV) | webdev + finanzas | Media | F2.D4 |
| CRM / leads | Lead | Registrar leads, moverlos por el funnel (NUEVO→CERRADO) | Crear tablero de leads tipo kanban | webdev + ventas | Media | F1.D (leads) |
| Reportes | Session, Grade, Task | Asistencia, progreso académico, retención | Crear reportes de asistencia y progreso por estudiante | webdev | Media | F2.D2, F2.D3 |
| Ajustes | User, config | Números de contacto, horarios de franjas, enlaces de integración (F3) | Crear página de ajustes del instituto | webdev | Baja | F2.A1 |

**Salida de Fase 2:** los tres roles navegan sus paneles completos en local con datos reales del seed.

---

## FASE 3 — Integraciones

**Objetivo:** conectar pagos, agenda, video y prácticas didácticas.

### Épica F3.A — Pagos (Wompi + transición manual)

| Tarea | Responsable | Prioridad | Depende de |
|---|---|---|---|
| Mantener y pulir el flujo manual actual (Nequi/Davivienda): comprobante → aprobación admin → saldo actualizado (base de Fase 2) | finanzas + webdev | Alta | F2.D4 |
| Crear cuenta Wompi Colombia (sandbox), obtener API keys y acceptance token; documentar credenciales en secreto local (`.env`, nunca en git) | finanzas | Alta | F2.D4 |
| Implementar creación de transacción Wompi desde el frontend (CARD / NEQUI / PSE) en `Payment` con `transaccionIdWompi` | webdev | Alta | F3.A2 |
| Implementar webhook `POST /api/payments/wompi/webhook` (firma verificada) que actualiza el estado de `Payment` | webdev | Alta | F3.A3 |
| Implementar simulador local de webhook Wompi (script de pruebas) para validar el flujo sin HTTPS | webdev | Media | F3.A4 |
| Documentar política de reembolsos y manejo de pagos fallidos (`docs/FINANZAS-APIS.md`) | finanzas | Media | F3.A3 |

### Épica F3.B — Agenda (Cal.com/Calendly)

| Tarea | Responsable | Prioridad | Depende de |
|---|---|---|---|
| Decidir Cal.com (recomendado: open source, sin costo) vs Calendly (ya previsto en estrategia) y crear cuenta de prueba | director + soporte | Media | F2.C2 |
| Integrar webhook de reserva: al agendar en Cal.com/Calendly se crea/confirma una `Session` en el LMS (solo para clase diagnóstico o reprogramaciones) | webdev | Media | F3.B1 |
| Mantener la reserva nativa del LMS como flujo principal de las clases recurrentes de los 6 estudiantes (franjas fijas L–S) | webdev | Alta | F2.C2 |
| Configurar recordatorios de clase (in-app + WhatsApp/email manual como transición) 30 min antes | soporte + webdev | Baja | F3.B2 |

### Épica F3.C — Video (Zoom / Google Meet)

| Tarea | Responsable | Prioridad | Depende de |
|---|---|---|---|
| Definir convención de enlace por sesión: la profesora pega el enlace Meet/Zoom en la `Session` (manual) y el estudiante lo ve con botón "Unirse" | webdev | Alta | F2.B2 |
| Guardar y mostrar historial de enlaces por sesión; validar que solo el estudiante matriculado vea el enlace (permisos por enrollment) | webdev | Alta | F3.C1 |
| Evaluar (sin implementar en producción) embebido con Zoom SDK o enlace externo; dejar decisión documentada | webdev | Baja | F3.C1 |
| Configurar cuenta corporativa Zoom/Meet y plantilla de reunión con horario de franja | soporte | Baja | F3.C1 |

### Épica F3.D — Prácticas didácticas (interactivas + ElevenLabs + RAG)

| Tarea | Responsable | Prioridad | Depende de |
|---|---|---|---|
| Convertir las actividades interactivas existentes (FillInBlanks, WordSearch) en plantillas de `PracticeActivity` ligadas a Task/Course | webdev + didactica | Alta | F2.B4 |
| Crear 2–3 plantillas nuevas de práctica por nivel: quiz de opción múltiple, listening con audio, conversación guiada (apoyada en los paquetes de speaking existentes) | didactica | Alta | F3.D1 |
| Integrar ElevenLabs (`src/lib/tts.js` ya existe): generar audios de listening/tareas y guardar `audioUrl` en `Task`/`PracticeActivity` | webdev + didactica | Alta | F3.D1 |
| Conectar el motor RAG existente (perfil `StudentProfile`) al generador de lecciones para personalizar vocabulario y temas por estudiante (energía solar, salud, bienes raíces, kids, yoga) | webdev + didactica | Alta | F2.B7 |
| Registrar intentos de práctica (`attempts`) para alimentar el progreso y el reporte académico | webdev | Media | F3.D2 |
| Documentar costos y límites de ElevenLabs y APIs en `docs/FINANZAS-APIS.md` | finanzas | Media | F3.D3 |

### Épica F3.E — Notificaciones y mensajería

| Tarea | Responsable | Prioridad | Depende de |
|---|---|---|---|
| Enviar notificaciones in-app (clase próxima, tarea asignada, pago aprobado) desde el módulo `Message` | webdev | Media | F2.A3 |
| Preparar plantilla de mensaje WhatsApp (manual vía WhatsApp Business) para confirmación de clase y recordatorio — sin automatizar aún | ventas + soporte | Baja | F3.B4 |

**Salida de Fase 3:** pagos manuales + Wompi sandbox funcionales, agenda integrada, enlaces de video operativos y prácticas personalizadas por RAG.

---

## FASE 4 — Pruebas internas y ajustes (con los 6 estudiantes actuales)

**Objetivo:** probar el LMS con datos y personas reales hasta declararlo "funcional y probado". Sin publicación: se prueba en localhost, con pantalla compartida en las clases y, si la directora lo autoriza, con túnel temporal desechable (ngrok/cloudflared) solo durante la sesión de prueba, sin dominio ni producción.

### Épica F4.A — Preparación del entorno de prueba

| Tarea | Responsable | Prioridad | Depende de |
|---|---|---|---|
| Definir matriz de pruebas por rol y flujo (estudiante/profesor/admin × clase, tarea, práctica, pago) | soporte + webdev | Alta | F3 completa |
| Preparar cuentas de prueba: 6 estudiantes + 1 profesora/admin con contraseñas temporales y datos reales del seed | webdev | Alta | F1.E3 |
| Preparar guía corta (1 página) para que la directora muestre el LMS a cada estudiante en clase | didactica + contenido | Media | F4.A1 |
| (Opcional, con aprobación de la directora) Configurar túnel temporal desechable para 2 pruebas remotas; se cierra al terminar cada sesión | webdev | Baja | F4.A2 |

### Épica F4.B — Ejecución de pruebas por estudiante

| Estudiante | Nivel/enfoque | Qué probar prioritariamente |
|---|---|---|
| Andrés Carrillo | B1, energía solar/tecnología | RAG: lección con vocabulario de su industria; tarea + entrega; pago |
| Milena Bautista | B1, innovación social en salud | RAG: lección personalizada; listening con audio ElevenLabs; feedback |
| Jenifer | B1, bienes raíces | Agenda/reprogramación; prácticas interactivas; notas y feedback |
| Luciana Castañeda (kids) | A1, refuerzo escolar | Actividades lúdicas (wordsearch/fill-blanks); supervisión de acudiente; perfil kids |
| Nico & Juanita | A2, conversación | Sesiones compartidas (2 estudiantes, 1 enrollment); agenda y asistencia |
| Gabriela | B2, speaking fluido | Entrega de audio (speaking); rúbrica y feedback; práctica conversación guiada |

| Tarea | Responsable | Prioridad | Depende de |
|---|---|---|---|
| Ejecutar prueba guiada de 20 min con cada estudiante durante su clase (la profesora comparte pantalla) y registrar hallazgos | soporte (guía) + directora (ejecuta) | Alta | F4.A1 |
| Pedir a cada estudiante completar 1 ciclo completo sin ayuda: ver clase → entrar a clase → entregar tarea → hacer 1 práctica → revisar su pago | directora + soporte | Alta | F4.B1 |
| Registrar cada incidencia en `ops/INCIDENCIAS.md` (nuevo archivo operativo) con severidad (crítica/menor) y responsable | soporte | Alta | F4.B1 |
| Recoger encuesta corta de satisfacción de uso (5 preguntas, escala 1–5) a estudiantes y acudientes | soporte | Media | F4.B2 |

### Épica F4.C — Validación de integraciones y datos

| Tarea | Responsable | Prioridad | Depende de |
|---|---|---|---|
| Validar Wompi sandbox: 1 transacción simulada completa (crear → webhook → estado en `Payment`) | finanzas + webdev | Alta | F3.A4 |
| Validar reserva vía Cal.com/Calendly → creación de `Session` (1 prueba) | soporte + webdev | Alta | F3.B2 |
| Conciliar reporte de ingresos del LMS vs contabilidad manual (objetivo: coincidencia 100%) | finanzas | Alta | F2.D5 |
| Validar que los 6 perfiles RAG generan lecciones coherentes con nivel y propósito (revisión de la directora) | didactica | Alta | F3.D4 |
| Ejecutar `npm run lint`, `npm run build` y revisión de errores de consola en los 3 roles | webdev | Alta | F4.B |
| Corregir bugs críticos encontrados y re-probar los flujos afectados (ciclo de ajuste) | webdev | Alta | F4.C1–C5 |
| Documentar en `docs/ARQUITECTURA.md` y manuales de rol los ajustes finales | webdev + soporte | Media | F4.C6 |
| Respaldar `lms.db` y probar restauración (procedimiento de backup) | webdev | Alta | F4.C6 |

**Salida de Fase 4:** los 6 estudiantes usan el LMS en flujos reales, incidencias críticas resueltas y sistema declarado "funcional y probado" por la directora.

---

## FASE 5 — Despliegue público (SOLO PLAN, sin ejecución ni fechas)

**Objetivo:** dejar listo el checklist de publicación para cuando la directora lo apruebe. Ninguna tarea de esta fase se ejecuta ahora.

### Checklist de publicación (plan)

| Tarea (a planear, NO ejecutar) | Responsable sugerido |
|---|---|
| Registrar dominio acninstitute.com.co y configurar DNS | director |
| Elegir hosting Vercel/Netlify; migrar BD SQLite → PostgreSQL (provider de Prisma) con respaldo previo | webdev |
| Migrar datos reales: usuarios, perfiles RAG, matrículas, pagos históricos (script de migración) | webdev |
| Reemplazar `wa.me/57` por el número real de WhatsApp Business | webdev |
| Activar Wompi en producción: acceptance token real, webhooks con HTTPS, verificación de dominio | webdev + finanzas |
| SEO: metadatos, sitemap, Open Graph, blog (5 artículos del roadmap) | contenido |
| Correo transaccional (registro, recordatorios, recibos) | webdev + soporte |
| Google Business Profile + reseñas de estudiantes actuales | ventas |
| Política de privacidad, términos y tratamiento de datos (Ley 1581/2012) visibles | director |
| Monitoreo y alertas de errores; plan de backup y rollback documentado | webdev |
| Pruebas de aceptación finales en producción (entorno staging primero) | soporte + webdev |

---

## A. Riesgos y bloqueos

| # | Riesgo/bloqueo | Severidad | Mitigación |
|---|---|---|---|
| R1 | **Discrepancia de stack**: la documentación dice Next.js 16 pero la app real es Vite+React 18. Si no se resuelve, los agentes escriben código para el framework equivocado | Alta | Decisión D0 en F1.A1: verificar y documentar; el contrato REST y el esquema son agnósticos |
| R2 | La directora es la única docente; probar con 6 estudiantes en horario de clase consume su tiempo | Alta | Pruebas guiadas de 20 min dentro de clases existentes; soporte prepara guías e incidencias |
| R3 | Pagos históricos manuales (Nequi/Davivienda) sin estructura | Media | Registro inicial manual en seed; conciliación en F4.C3 |
| R4 | Wompi exige HTTPS para webhooks reales; en local no hay | Media | Webhook simulado en F3.A5; activación real solo en F5 |
| R5 | Costos de APIs (ElevenLabs $88.000/mes, pasarelas, agenda) | Media | Documentar en `docs/FINANZAS-APIS.md`; límites de uso y alertas |
| R6 | Datos de los estudiantes en localhost sin cifrado ni política de datos | Media | Política de privacidad y backup desde F4; contraseñas con bcrypt desde F1 |
| R7 | El frontend actual usa `localStorage` (`uslearn_*`); coexiste con la nueva BD durante la transición | Media | `lmsClient.js` (F2.A2) reemplaza el acceso directo progresivamente |
| R8 | Calendly/Cal.com requieren cuentas y posible costo; franjas fijas de los 6 estudiantes no encajan con citas por demanda | Baja | La reserva nativa del LMS es el flujo principal; la agenda externa solo para diagnóstico/reprogramaciones |
| R9 | Riesgo de alcance: avanzar a F5 antes de cerrar F4 | Alta | Criterios de salida de F4 (sección B) son condición obligatoria para autorizar F5 |
| R10 | Sin CRM, los leads se manejan en WhatsApp | Media | Módulo `Lead` en F2.D6 + registro manual por ventas |

## B. Criterios de salida de la Fase 4 (para autorizar la Fase 5)

1. **Cobertura:** los 6 estudiantes completaron al menos 2 ciclos completos en el LMS (clase vista → tarea entregada y calificada → práctica realizada → pago registrado) sin asistencia de la directora para navegar.
2. **Calidad técnica:** cero errores críticos (bloqueantes) abiertos; los menores están en `ops/INCIDENCIAS.md` con responsable y fecha; `npm run lint` y `npm run build` pasan sin errores.
3. **Roles:** los 3 roles (student/teacher/admin) operan en local con datos reales de los 6 estudiantes y permisos correctos.
4. **Conciliación financiera:** el reporte de ingresos del LMS coincide al 100% con la contabilidad manual actual (~$2.500.000 COP/mes, 6 estudiantes, 15 clases/semana).
5. **Integraciones validadas:** 1 transacción Wompi sandbox completa; 1 reserva externa → `Session`; enlace de video visible y funcional en cada sesión; al menos 1 audio ElevenLabs en el flujo de tarea.
6. **RAG operativo:** los 6 perfiles generan lecciones/actividades coherentes con nivel y propósito, validado por la directora.
7. **Satisfacción:** encuesta de uso ≥ 4/5 en promedio; sin rechazo manifiesto de ningún estudiante.
8. **Decisión de stack y migración:** vía de stack confirmada y plan de migración de datos a producción aprobados por la directora y documentados.
9. **Backup probado:** restauración de `lms.db` verificada; procedimiento documentado.
10. **Documentación al día:** `docs/ARQUITECTURA.md`, manuales por rol y `ops/ESTADO DEL PROYECTO.md` actualizados con resultados de F4.

## C. Dependencias entre fases

```
F1 (modelo + API) ──► F2 (módulos) ──► F4 (pruebas) ──► autoriza ──► F5 (plan de deploy)
        │                  │
        └──► F3 (integraciones) ──────┘
```

- **F1 → F2:** los módulos consumen las entidades y endpoints definidos en F1; si el contrato REST se congela a tiempo, F2 puede avanzar en paralelo con mocks.
- **F1 → F3:** integraciones escriben en entidades `Payment`, `Session`, `PracticeActivity`, `Message` — requieren el esquema y sus endpoints.
- **F2 → F3:** los puntos de integración (botón de pago, agenda, enlace de video, prácticas) se insertan en pantallas ya construidas.
- **F2/F3 → F4:** las pruebas requieren módulos completos y estables; corregir en F4 no debe cambiar el contrato de datos sin notificar a todos los agentes.
- **F4 → F5:** F5 se autoriza SOLO con los 10 criterios de salida de la sección B cumplidos y aprobados por la directora.
- **Transversal:** el Agente Director actualiza `ops/ESTADO DEL PROYECTO.md` al cierre de cada épica y registra decisiones en `docs/ARQUITECTURA.md`.

---

*Documento de planificación. No se ejecutó ni se modificó código en `web/` durante su elaboración.*
