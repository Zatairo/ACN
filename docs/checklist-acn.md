# Checklist completo de creación del sistema ACN Institute (LMS + aula virtual)

## 1. Estrategia, legal y modelo de negocio

- [ ] Revisar y confirmar el **modelo de negocio** definido en `Plan-de-Negocio-ACN-Institute.docx` (paquetes, precios, segmentos, horarios).
- [ ] Unificar precios y nombres de paquetes en una **fuente única** (Google Sheets u otra) y usarla como referencia oficial para la web y finanzas.
- [ ] Definir la **figura jurídica** del instituto (tipo de empresa) con apoyo de contador/abogado.
- [ ] Definir responsable legal de **protección de datos** (Política de privacidad, Términos y condiciones, tratamiento de datos de estudiantes).
- [ ] Redactar y guardar en `docs/` los documentos: Política de privacidad, Términos de uso, Política de cookies.
- [ ] Definir estrategia comercial inicial (canales, precios, promociones) y reflejarla en `docs/ESTRATEGIA COMERCIAL - ACN INSTITUTE ONLINE.md`.

## 2. Espacio de trabajo ACN (repos y estructura)

- [ ] Crear repositorio principal `acn-institute` en GitHub.
- [ ] Crear carpeta `web/` para la aplicación Next.js (frontend y API).
- [ ] Crear carpeta `lms/` para documentación técnica del modelo de datos y APIs.
- [ ] Crear carpeta `ops/` para archivos operativos (`ESTADO DEL PROYECTO.md`, `LEADS.md`, estudiantes activos, horarios).
- [ ] Crear carpeta `docs/` para estrategia comercial, arquitectura, manuales internos, legal.
- [ ] Documentar en `docs/ARQUITECTURA.md` el stack tecnológico, módulos y decisiones clave.
- [ ] Configurar GitHub Projects/Issues (o herramienta equivalente) para backlog y épicas del proyecto.

## 3. Infraestructura técnica base

- [ ] Instalar Node.js LTS, pnpm/npm y Git en el entorno de desarrollo.
- [ ] Instalar Docker y configurar contenedores para base de datos (PostgreSQL/MySQL) y servicios auxiliares.
- [ ] Configurar editor (VS Code) con extensiones de TypeScript, ESLint, Prettier.
- [ ] Crear proyecto Next.js 16 en `web/` con TypeScript y Tailwind.
- [ ] Configurar base de datos relacional (PostgreSQL recomendada) para usuarios, cursos, matrículas, sesiones, tareas, pagos.
- [ ] Configurar ORM (Prisma o TypeORM) y sistema de migraciones.

## 4. Dominio, hosting y despliegue inicial

- [ ] Registrar dominio para ACN Institute y configurar DNS hacia el proveedor de hosting (Vercel, Oracle, etc.).
- [ ] Configurar HTTPS y certificados SSL.
- [ ] Desplegar versión inicial de la web (landing simple) desde `web/`.
- [ ] Configurar CI/CD (GitHub Actions u otra) para build, tests y deploy automáticos.

## 5. Autenticación y roles

- [ ] Implementar sistema de autenticación (NextAuth/JWT) en la app.
- [ ] Definir roles: `student`, `teacher`, `admin`.
- [ ] Implementar registro/login para estudiantes.
- [ ] Implementar login para profesores y administradores.
- [ ] Crear panel básico de administración para crear usuarios y asignar roles.

## 6. Modelo de datos del LMS

- [ ] Definir esquema de `users` (datos personales, rol, estado).
- [ ] Definir `courses` (nombre, nivel MCER, descripción, estado).
- [ ] Definir `modules` o `units` dentro de cada curso.
- [ ] Definir `enrollments` (relación usuario–curso, fecha, estado).
- [ ] Definir `sessions` (clases programadas, fecha, hora, profesor, curso, enlace de video).
- [ ] Definir `tasks` (tareas/actividades con tipo, nivel, curso, fecha límite).
- [ ] Definir `grades` (notas asociadas a tareas, rubricas, fecha de evaluación).
- [ ] Definir `payments` (estudiante, paquete, valor, método de pago, estado).
- [ ] Definir `activities` (prácticas externas, juegos, recursos interactivos).
- [ ] Definir `messages`/`notifications` (comunicación interna entre profesor–estudiante–admin).

## 7. Cuentas e integraciones externas

### Pagos (Wompi)
- [ ] Crear cuenta Wompi Colombia y obtener credenciales (API keys, acceptance tokens).
- [ ] Leer documentación de métodos de pago (CARD, NEQUI, PSE) y límites de uso.
- [ ] Definir tabla `payment_sources` y `transactions` en la base de datos.
- [ ] Implementar creación de transacciones Wompi desde la web.
- [ ] Implementar recepción de webhooks y actualización de `payments` en BD.
- [ ] Documentar política de reembolsos y manejo de pagos fallidos.

### Video y aula virtual (inicio)
- [ ] Crear y configurar cuenta Zoom y/o Google Meet para clases.
- [ ] Definir cómo se generan enlaces de reunión por cada `session`.
- [ ] Implementar embebido/links seguros dentro de la web (solo estudiantes matriculados).

### Correo y notificaciones
- [ ] Crear cuenta de correo transaccional (SendGrid, Mailgun, etc.).
- [ ] Configurar plantillas de correo para registro, confirmación de clase, recordatorios, tareas.
- [ ] Implementar módulo de notificaciones internas (mensajes, anuncios).

### Plataformas de práctica externa
- [ ] Crear cuentas en Wordwall, Liveworksheets y otras herramientas de práctica.
- [ ] Definir formato de registro de actividades externas en la BD (`activities`).
- [ ] Diseñar vistas para incrustar/enlazar actividades externas dentro de los cursos.

## 8. Módulo de estudiante (frontend y lógica)

- [ ] Diseñar layout del dashboard del estudiante (progreso, nivel, próximas clases, tareas).
- [ ] Implementar vista del **estado/nivel actual** y progreso en el curso.
- [ ] Implementar sección de **tareas** (pendientes, realizadas, calificaciones).
- [ ] Implementar sección de **prácticas** (actividades nativas + externas tipo Wordwall/Liveworksheets).
- [ ] Implementar vista de **agenda de clases** (próximas sesiones y historial).
- [ ] Implementar flujo de **reserva de clase** (solicitud de horario, validación de disponibilidad, creación de `session`).
- [ ] Implementar página de **planes y pagos**, conectada con Wompi.
- [ ] Implementar mensajería básica con profesor (en la web).

## 9. Módulo de profesor

- [ ] Diseñar dashboard docente (lista de estudiantes, cursos, próximas clases).
- [ ] Implementar vista de sesiones programadas con detalles de cada clase.
- [ ] Implementar marcado de asistencia en cada `session`.
- [ ] Implementar creación y asignación de tareas a estudiantes/grupos.
- [ ] Implementar módulo de calificaciones (rubricas, notas por tarea).
- [ ] Implementar vista del **nivel y progreso** de cada estudiante.
- [ ] Implementar mensajería interna hacia estudiantes.

## 10. Módulo de administrador y CRM interno

- [ ] Implementar panel de gestión de usuarios (crear, editar, desactivar, asignar roles).
- [ ] Implementar panel de cursos y niveles (crear/editar/eliminar cursos, módulos).
- [ ] Implementar gestor de material de estudio (subida/edición de recursos: PDFs, videos, links interactivos).
- [ ] Implementar vista de pagos: estudiantes pagados, paquetes, fechas de vencimiento.
- [ ] Implementar panel tipo CRM: leads, estados del funnel (contactado, diagnóstico, oferta, cerrado).
- [ ] Implementar panel de soporte: incidencias, reprogramaciones, problemas de acceso.
- [ ] Implementar panel de finanzas: resumen de ingresos, gastos y utilidad.

## 11. Módulo de analítica y calidad

- [ ] Integrar herramienta de analítica web (Google Analytics u otra) para tráfico y eventos clave.
- [ ] Definir KPIs académicos: progreso promedio, tasa de finalización, asistencia.
- [ ] Definir KPIs comerciales: tasa de conversión, leads por canal, ingreso promedio por estudiante.
- [ ] Implementar dashboards internos para Directora y agentes clave.
- [ ] Implementar flujo de revisión pedagógica (Jefe de Estudios) sobre cursos y materiales.

## 12. Estrategia de consumo de APIs y costos

- [ ] Documentar en `docs/FINANZAS-APIS.md` los costos mensuales y límites de uso de Wompi, correo, video, Wordwall, etc.
- [ ] Definir límites de uso aceptables (número máximo de correos, transacciones, sesiones de video) según presupuesto.
- [ ] Implementar alertas internas cuando se alcance cierto umbral de consumo.

## 13. Flujo de trabajo con agentes en Opencode

- [ ] Definir cómo el **Agente Director** lee este checklist y prioriza épicas en `ops/ESTADO DEL PROYECTO.md`.
- [ ] Definir tareas específicas para el Agente Webdev a partir de las secciones de infraestructura, módulos y APIs.
- [ ] Definir tareas para el Agente de Didáctica relacionadas con creación de cursos, unidades y material.
- [ ] Definir tareas para los agentes de Ventas, Soporte y Finanzas basadas en los módulos de CRM, pagos y soporte.
- [ ] Documentar en `web/AGENTS.md` cómo cada agente interactúa con la web y con los archivos de `ops/` y `docs/`.

## 14. Onboarding de nuevos desarrolladores/colaboradores

- [ ] Crear guía de onboarding técnico en `docs/ONBOARDING-DEV.md` (stack, comandos, estructura, estándares).
- [ ] Crear guía de onboarding funcional en `docs/ONBOARDING-OPS.md` (cómo funciona el instituto, roles, procesos).
- [ ] Definir estándares de código (linting, testing, revisiones) y documentarlos.
- [ ] Crear ejemplos mínimos de flujos completos (registro estudiante, matrícula en curso, reserva de clase, tarea, calificación, pago).