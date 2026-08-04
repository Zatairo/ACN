# ARQUITECTURA — LMS ACN Institute

> Versión: 2.0 · 2026-08-03 · Actualizado por: webdev (Fase 2 del `PLAN LMS ACN INSTITUTE.md`)
> Estado: **Fase 1 + Fase 2 completadas** — API local funcional contra SQLite con seed DEMO y módulos de estudiante/profesor/admin en el frontend. Sin despliegue (Fase 5 es solo plan).

---

## 1. Decisión de stack (tarea F1.A1) — **Vía A confirmada**

La documentación raíz describía `web/` como Next.js 16; la verificación en disco (2026-08-02) confirma lo contrario:

| Verificación | Resultado |
|---|---|
| `web/package.json` | Vite 6 + React 18.2 + React Router 6 + Tailwind 3, `"type": "module"` |
| `web/node_modules/next` | No existe |
| App Router / `next.config.js` | No existen |
| Frontend | Landing, auth local (`base44Client.js` sobre localStorage), dashboard, actividades |

**Decisión: Vía A** (recomendada por el plan): se mantiene la app Vite+React y se añade un **backend propio en `web/server/`** (Express 5 + SQLite + Prisma 6). El contrato REST es agnóstico del stack, así que F2 puede consumirlo tal cual.

### Desviación justificada: Prisma 6 (no 7)
`npm` instala hoy Prisma 7, que exige `prisma.config.ts` + driver adapters (p. ej. `@prisma/adapter-better-sqlite3`) y un generador con salida explícita. Se **fijó `prisma@^6`** (6.19.3) porque conserva el flujo clásico y estable (`.env`, `package.json#prisma.seed`, `prisma-client-js`, SQLite sin adapters) y es la versión documentada por el plan. La migración a Prisma 7 en Fase 5 es mecánica (cambiar provider a PostgreSQL + config nueva).

---

## 2. Persistencia — SQLite + Prisma

- Base: `web/data/lms.db` (fuera de git: ver `web/gitignore.txt` y `.gitignore` raíz).
- URL: `DATABASE_URL="file:../data/lms.db"` en `web/.env` (relativa a `prisma/` → `web/data/lms.db`).
- Migraciones versionadas en `web/prisma/migrations/` (inicial: `20260803014803_init`).
- En producción (F5): cambiar provider a `postgresql` sin tocar el esquema (decisión F1.B del plan).
- Justificación: costo cero, sin DevOps, transacciones, migraciones + tipos TS; el `localStorage` queda descartado (no compartido entre roles ni auditable).

## 3. Esquema — 17 modelos

16 entidades del plan (tabla F1.C) + 1 añadida (justificada):

| Modelo | Notas |
|---|---|
| `User` | rol `STUDENT\|TEACHER\|ADMIN`; estado `ACTIVE\|INACTIVE\|SUSPENDED`; email único |
| `StudentProfile` | 1:1 con User; perfil RAG (`datosRAG` JSON: intereses, vocabulario, restricciones) |
| `Course` | 1 por estudiante (personalizado); estado `DRAFT\|ACTIVE\|ARCHIVED`; teacherId |
| `Module` | Unidades dentro del curso (orden) |
| `Enrollment` | Control de paquetes; **`esDemo` (añadido)**: true = matrícula DEMO del seed, nunca real |
| `Session` | duracionMin default **45**; estado `SCHEDULED\|COMPLETED\|CANCELLED\|RESCHEDULED\|NO_SHOW`; creadaPor `PROFESORA\|ESTUDIANTE\|SISTEMA` |
| `Task` | tipo `CONVERSACION\|ESCRITURA\|LECTURA\|LISTENING\|VOCABULARIO\|EXAMEN` |
| `Submission` | Entrega del estudiante (texto/archivo/audio) |
| `Grade` | nota 0–100, `rubricaJson` (rúbricas MCER "can-do"), feedback texto/audio |
| `Package` | **Básico 8/$360.000 · Semi Intensivo 12/$510.000 · Bimestral 16/$680.000 · Semi Intensivo Plus 24/$990.000 · Trimestral 36/$1.350.000** (fuente: `Services- Andres.docx`; precio/clase 45.000 / 42.500 / 42.500 / 41.250 / 37.500) |
| `Payment` | metodo `NEQUI\|DAVIVIENDA\|WOMPI_CARD\|WOMPI_NEQUI\|WOMPI_PSE\|EFECTIVO`; estado `PENDIENTE\|APROBADO\|RECHAZADO\|REEMBOLSADO\|VENCIDO`; `transaccionIdWompi` (F3) |
| `PracticeActivity` | `FILL_BLANKS\|WORD_SEARCH\|QUIZ\|LISTENING\|GUIDED_CONVERSATION\|ROLE_PLAY` |
| `PracticeAttempt` | **añadida**: intentos de práctica (plan F3.D5: alimenta progreso) |
| `Resource` | PDF/LINK/AUDIO/VIDEO/DOC por curso/módulo |
| `Message` | MENSAJE/RECORDATORIO/ANUNCIO, leído, conversaciones |
| `Lead` | CRM: canal `WEB\|IG\|TIKTOK\|FOLLETO\|REFERIDO`; funnel `NUEVO→CONTACTADO→DIAGNOSTICO→OFERTA→CERRADO\|PERDIDO` |
| `AuditLog` | Trazabilidad de acciones admin |

Índices en los campos de filtrado habituales (estado, fecha, FK, conversación).

## 4. API REST — contrato y autenticación

Base `http://localhost:4000/api`. Respuestas consistentes: `{ data: ... }` / `{ error: { code, message, details? } }`. Autenticación: `Authorization: Bearer <JWT>` (7 días, secret en `.env`). **ADMIN pasa las guardas de TEACHER** (la directora es admin+docente). Errores conocidos de Prisma mapeados (P2002→409, P2025→404, P2003→400).

| Módulo | Endpoints | Auth |
|---|---|---|
| Auth | `POST /auth/register` · `POST /auth/login` · `POST /auth/logout` · `GET /auth/me` · `POST /auth/reset-password` | Pública / JWT |
| Usuarios | `GET/POST /users` · `PATCH/DELETE /users/:id` (DELETE = borrado lógico → SUSPENDED) | ADMIN |
| Perfiles RAG | `GET/PUT /students/:id/profile` · `POST /students/:id/level-test` | STUDENT(propio) + TEACHER/ADMIN |
| Cursos+Módulos | `GET/POST /courses` · `GET/PATCH /courses/:id` · `GET/POST /courses/:id/modules` | TEACHER/ADMIN |
| Matrículas | `GET/POST /enrollments` · `PATCH /enrollments/:id` (pausar/cerrar, consumir sesiones) | ADMIN |
| Sesiones | `GET /sessions?from&to&studentId&estado` · `POST /sessions` · `PATCH /sessions/:id` · `POST /sessions/:id/cancel` | JWT; alcance por rol; STUDENT crea con `creadaPor=ESTUDIANTE` |
| Tareas+Entregas+Notas | `GET/POST /tasks` · `PATCH /tasks/:id` · `POST /tasks/:id/submissions` · `POST /tasks/:id/grades` (rúbrica JSON) | STUDENT/TEACHER |
| Paquetes | `GET /packages` · `PATCH /packages/:id` (precios, recalcula precio/clase) | ADMIN |
| Pagos | `GET/POST /payments` (manual + comprobante) · `PATCH /payments/:id` (aprobar/rechazar) · `POST /payments/wompi/webhook` (**501 hasta Fase 3**) | STUDENT/ADMIN |
| Prácticas | `GET/POST /activities?courseId` · `GET/POST /activities/:id/attempts` | STUDENT/TEACHER |
| Materiales | `GET/POST /resources` · `DELETE /resources/:id` | TEACHER/ADMIN (GET estudiantes solo de sus cursos) |
| Mensajes | `GET /messages?with=userId` · `POST /messages` · `POST /messages/:id/read` | JWT |
| CRM Leads | `GET/POST /leads` · `PATCH /leads/:id` (funnel) | ADMIN (rol VENTAS si llega, en F2) |
| Reportes | `GET /reports/income` · `GET /reports/attendance` · `GET /reports/progress` | ADMIN |
| Integraciones | `GET /integrations/status` (solo status; webhooks en F3) | ADMIN |
| Health | `GET /health` | Pública |

### Endpoints añadidos en Fase 2 (backend F2)

| Módulo | Endpoints | Auth | Notas |
|---|---|---|---|
| Dashboard | `GET /dashboard` | JWT | Agregado por rol (STUDENT/TEACHER/ADMIN); el de TEACHER incluye `enrollmentId` por estudiante para crear sesiones |
| Notificaciones | `GET /notifications` · `POST /notifications/read-all` | JWT | No leídos + próximas clases; polling del layout (60 s) |
| Upload | `POST /upload` (multipart) | JWT | 10 MB máx., whitelist de extensiones; sirve estáticos en `/uploads/*` |
| Sesiones | `GET /sessions/:id` · `PATCH /sessions/:id` (reprogramación) | JWT | STUDENT solicita reprogramación (`reprogramacionSolicitada/FechaHora/Nota`); TEACHER aprueba → `RESCHEDULED` |
| Tareas | `GET /tasks/:id` | JWT | Detalle con entregas + notas |
| Mensajes | `GET /messages/conversations` | JWT | Resumen por contacto con no leídos |
| Reportes | `GET /reports/income/export` | ADMIN | CSV con BOM (Excel) + fila TOTAL |

Total: **61 endpoints** (54 de F1 + 7 añadidos en F2).

## 5. Estructura del servidor

```
web/server/
  index.ts                 — bootstrap Express 5, montaje de routers, 404, manejo de errores centralizado
  lib/errors.ts            — AppError (status + code + details)
  lib/prisma.ts            — PrismaClient singleton (fallback de DATABASE_URL)
  lib/jwt.ts               — sign/verify JWT
  lib/validate.ts          — validación zod → 400 consistente
  lib/audit.ts             — AuditLog (nunca rompe la operación)
  middleware/auth.ts       — requireAuth + requireRole
  routes/*.ts              — 15 módulos (rutas + validación + lógica con Prisma)
```

## 6. Cómo correr (en `web/`)

```bash
npm install                     # instala dependencias (incl. API)
npm run dev:api                 # solo API (tsx watch) en :4000
npm run dev:all                 # API + Vite juntos (concurrently) :4000 + :5173
npm run db:migrate              # prisma migrate dev
npm run db:seed                 # seed DEMO (borra y recrea los datos demo)
npm run db:studio               # explorar la BD en el navegador
npm run lint && npm run build   # control de calidad (obligatorio antes de terminar)
```

- Vite (`npm run dev`) proxya `/api/*` → `http://localhost:4000` (ver `vite.config.js`).
- Variables en `web/.env` (NO versionado): `DATABASE_URL`, `PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN`.

## 7. Seed DEMO y credenciales (plan F1.E3)

`npm run db:seed` **borra y recrea** los datos de demostración. Contraseña temporal para todas las cuentas: **`Demo123!`** (cambiar antes de F5).

| Cuenta | Rol | Estado | Nota |
|---|---|---|---|
| `andrea@acninstitute.com` | ADMIN | **ACTIVE** | Directora/docente; la única cuenta que puede iniciar sesión |
| `profesora.demo@acn.com` | TEACHER | **ACTIVE** | Profesora demo (añadida en F2) |
| `estudiante.demo@acn.com` | STUDENT | **ACTIVE** | Estudiante demo (añadida en F2) |
| `andres.carrillo@demo.acn` | STUDENT | INACTIVE | B1 · Energía solar/tecnología (Monalee) · Semi Intensivo |
| `milena.bautista@demo.acn` | STUDENT | INACTIVE | B1 · Innovación social en salud · Semi Intensivo |
| `jenifer.roman@demo.acn` | STUDENT | INACTIVE | B1 · Bienes raíces / vida diaria · Semi Intensivo |
| `luciana.castaneda@demo.acn` | STUDENT | INACTIVE | A1 · Kids, refuerzo escolar · Básico |
| `nico@demo.acn` | STUDENT | INACTIVE | A2 · Conversación · Básico (matrícula compartida con Juanita) |
| `juanita@demo.acn` | STUDENT | INACTIVE | A2 · Sin matrícula propia (comparte la de Nico) |
| `gabriela@demo.acn` | STUDENT | INACTIVE | B2 · Speaking fluido (yoga) · Semi Intensivo |

Reglas del seed:
- **3 cuentas ACTIVAS** (admin, profesora demo, estudiante demo) con datos de demostración completos: 5 sesiones (2 futuras con enlace Meet/Google), 3 tareas (una con entrega SUBMITTED lista para calificar), 3 pagos (1 PENDIENTE con comprobante), 4 prácticas (FILL_BLANKS, WORD_SEARCH, QUIZ, LISTENING), 3 mensajes, 5 leads en distintos estados.
- Los 6 estudiantes históricos son **INACTIVE**: `login` responde 403 "Cuenta inactiva (DEMO/histórica)".
- 6 cursos personalizados (1 por estudiante; Juanita comparte el de Nico), 7 matrículas **`esDemo=true`**, perfiles RAG con datos reales de `Students 2025/` y 5 paquetes con precios de `Services- Andres.docx`.
- Archivos demo en `server/uploads/`: `demo-comprobante-nequi.png` y `demo-vocabulario-b1.pdf`.

## 8. Frontend — módulos LMS (Fase 2)

### F2.A Base compartida
- **`src/api/lmsClient.js`** — cliente HTTP real del LMS (token `acn_lms_token` en localStorage, `ApiError` normalizado, APIs agrupadas por módulo, `uploadFile` multipart, `downloadCsv`). Reemplaza a `base44Client` para todos los datos del LMS.
- **`src/lib/AuthContext.jsx`** — login real contra `POST /api/auth/login`; `user` con `rol` y `studentProfile`.
- **`src/pages/Login.jsx`** — redirige por rol (STUDENT→/estudiante, TEACHER→/profesor, ADMIN→/admin); sin botón Google.
- **`src/pages/Register.jsx`** — registro real (nombre+email+contraseña) → JWT → dashboard (sin OTP simulado).
- **`src/lib/NotificationsContext.jsx`** — polling 60 s de no leídos + próximas clases (badge del layout).
- **`src/components/lms/`** — `LmsRoleRoute` (guarda por rol; ADMIN pasa TEACHER), `LmsLayout` (sidebar por rol, idioma, logout), `common.jsx` (LmsPage, StatCard, EstadoBadge, NivelBadge, EmptyState, Spinner, Nota /100, ProgressBar).
- **`src/lib/lms-formatters.js`** — formateo COP/fechas + etiquetas ES/EN de todos los enums del contrato.
- **i18n** — diccionarios `es.js`/`en.js` ampliados con el bloque `lms.*` (~350 claves).

### F2.B Módulo estudiante (`/estudiante/*`)
`Dashboard` (próxima clase, saldo de sesiones, tareas, pagos), `Clases` (agenda + solicitud de reprogramación), `Tareas` + `TareaDetalle` (entregar por texto/archivo, ver nota/feedback), `Practicas` + `PracticaDetalle` (4 tipos interactivos con guardado de intentos), `Pagos` (registrar pago manual con comprobante subido, historial), `Mensajes`, `Perfil` (perfil RAG editable).

### F2.C Módulo profesor (`/profesor/*`)
`Dashboard` (por calificar, alertas de pago, próximas), `Agenda` (CRUD sesiones, asistencia COMPLETED/NO_SHOW, aprobar reprogramaciones), `Estudiantes` (ficha con perfil RAG + sesiones + tareas), `Tareas` (crear + calificar con feedback, escala 0–100), `Materiales` (subir PDF/audio/link por curso), `Mensajes`.

### F2.D Módulo admin (`/admin/*`)
`Dashboard` (KPIs del negocio), `Usuarios` (CRUD + suspender), `Cursos` (cursos + módulos + paquetes), `Cobros` (aprobar/rechazar pagos), `Finanzas` (ingresos por mes/método + exportar CSV), `CRM` (pipeline de leads), `Reportes` (asistencia + progreso), `Ajustes` (integracciones/estado F3).

### Rutas y layout
`src/App.jsx` monta las rutas LMS con `LmsRoleRoute` + `LmsLayout`; la zona clásica (landing, lecciones, perfil local) se conserva intacta bajo `ProtectedRoute`/`Layout`.

## 9. Prueba de humo Fase 1 (resultado 2026-08-02)

Script: prueba técnica de punta a punta contra `:4000` (38/39 pasos OK; el único "fallo" es un paso del test que llamaba a un endpoint `GET /tasks/:id` que **no existe en el contrato del plan** — se verifica el estado vía el reporte de progreso).

Cubierto y verificado:
- `GET /health` → `{ status: ok, db: connected }`.
- Login de Andrea (ADMIN) → JWT; `auth/me`; login de estudiante INACTIVE → **403**.
- CRUD usuario STUDENT (crear/editar); lista de 7 cuentas INACTIVE.
- Perfil RAG de Andrés (GET) y del nuevo estudiante (PUT + level-test B1→B2).
- 6 cursos; módulo creado; 6 matrículas todas `esDemo`.
- Sesión: crear (SCHEDULED) → PATCH reprogramar (RESCHEDULED + enlace Meet) → cancelar (CANCELLED).
- Tarea CONVERSACION → entrega (texto+audio) → calificación con rúbrica JSON (nota 85) → tarea GRADED (confirmado en `reports/progress`: promedioNota 85).
- Pago Nequi $360.000: PENDIENTE → APROBADO por admin; webhook Wompi → **501 (F3)**.
- Práctica FILL_BLANKS + intento (puntaje 80); recurso PDF; mensajes; lead CRM (NUEVO→DIAGNOSTICO).
- Reportes: income ($360.000 aprobados), attendance (asistencia %), progress.
- Seguridad: sin token → 401; estudiante en /reports/income → 403.
- Proxy Vite: `localhost:5173/api/health` → API OK.

## 9b. Prueba de humo Fase 2 (resultado 2026-08-03)

Smoke de punta a punta contra `:4000` con las 3 cuentas ACTIVAS (admin, profesora, estudiante), verificado después con `npm run db:seed` para restaurar el estado demo canónico:

- Login de los 3 roles → JWT; dashboard agregado por rol (profesora: 8 estudiantes con `enrollmentId`, 1 por calificar; admin: KPIs ingresos/mora/asistencia).
- Profesora: crear tarea (ASSIGNED) → calificar entrega SUBMITTED (nota 88/100, feedback) → tarea GRADED; crear sesión (SCHEDULED) → marcar asistencia (COMPLETED + `asistio=true`); crear material PDF; flujo de reprogramación: estudiante solicita → profesora aprueba (RESCHEDULED).
- Admin: CRUD usuario (crear/patch/borrado lógico SUSPENDED); CRM lead (NUEVO→OFERTA); reportes income/attendance/progress; CSV export (200, BOM + cabecera); aprobar pago (PENDIENTE→APROBADO); integraciones status.
- Estudiante: dashboard (matrícula, sesiones restantes, contacto docente); registrar pago con comprobante (PENDIENTE); conversaciones/mensajes (enviar + marcar leído); notificaciones (no leídos + próximas).
- Upload multipart (`POST /upload`) → URL servida por `/uploads/*` (200).
- Nota: escala de calificación **0–100** (consistente con F1; la UI lo refleja).

## 10. Notas de diseño y desviaciones (todas justificadas)

1. **Prisma 6 en vez de 7** — ver sección 1.
2. **`PracticeAttempt`** añadida al esquema — el plan la menciona en F3.D5 (`attempts`); se adelanta para no migrar el esquema dos veces.
3. **`Enrollment.esDemo`** — el plan exige matrículas "claramente marcadas como DEMO"; `User.estado=INACTIVE` marca al estudiante y `esDemo` marca la matrícula.
4. **DELETE /users/:id = borrado lógico** (estado SUSPENDED) — preserva trazabilidad y FK (pagos, matrículas); documentado en el endpoint.
5. **ADMIN pasa guardas TEACHER** — la directora es la única docente; evita cuentas duplicadas.
6. **`reset-password` exige contraseña actual** — el admin puede resetear a otros vía `PATCH /users/:id`.
7. **Wompi/Calendly/ElevenLabs**: solo `GET /integrations/status` y stubs 501 — Fase 3 según el plan.
8. **Login de INACTIVE bloqueado** (403) — los históricos no pueden entrar; F4 usará solo a Andrea.

## 11. Pendiente para Fases 3–4

- Fase 3: Wompi (webhook real), agenda externa/Calendly, ElevenLabs para audios, motor RAG (perfil → 4 pilares).
- Fase 4: pruebas internas con las cuentas DEMO activas (profesora/estudiante demo).
- En F5 (solo plan): PostgreSQL, dominio, WhatsApp real, SEO.
