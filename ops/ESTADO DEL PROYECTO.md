# ESTADO DEL PROYECTO — ACN Institute

> Archivo central de conocimiento compartido. Todos los agentes lo LEEN al iniciar y lo ACTUALIZAN después de cada cambio relevante.

## ⏱️ Última actualización
`2026-08-03` — **FASE 2 DEL LMS COMPLETADA** por webdev: módulos de estudiante (`/estudiante/*`, 7 páginas), profesor (`/profesor/*`, 5 páginas + chat) y admin (`/admin/*`, 8 páginas) conectados al backend real (61 endpoints REST con JWT por rol, 7 añadidos en F2: dashboard, notificaciones, upload, detalle de sesión/tarea, conversaciones, export CSV). Login y registro conectados al backend real; 2 cuentas demo ACTIVAS (profesora y estudiante). Seed ampliado con datos de demostración (sesiones, tareas, pagos con comprobante, prácticas, mensajes, leads). Lint + build verdes; smoke test F2 completo OK. Restricción vigente: **NO publicar la web** hasta cerrar Fase 4.

## 📋 Prioridad actual (en orden)
1. ~~Fase 1: modelo de datos + backend básico~~ — **COMPLETADA** (2026-08-02; ver `docs/ARQUITECTURA.md`)
2. ~~Fase 2: módulos estudiante/profesor/admin~~ — **COMPLETADA** (2026-08-03; ver `docs/ARQUITECTURA.md` sección 8)
3. Fase 3: integraciones (pagos Wompi, agenda, video, ElevenLabs, RAG) — SIGUIENTE
4. Fase 4: pruebas internas con cuentas DEMO (las 2 activas + los 6 históricos NO activos)
5. Fase 5: despliegue público — SOLO plan, no se ejecuta

## 🏢 Datos generales
- **Nombre**: ACN Institute (Inglés con Propósito)
- **Fundadora/Directora**: Andrea (perfil docente y directivo)
- **País**: Colombia (hispanohablantes)
- **Metodología**: Comunicativa, 100% personalizada, MCER A1–C1
- **Duración clase**: 45 min | **Modalidad**: Zoom / Google Meet
- **Pagos**: Nequi, Davivienda (próximamente: Wompi)
- **Web**: App Vite 6 + React 18 + Tailwind (documentación antigua decía Next.js 16 — verificado: NO es Next.js). LMS en construcción sobre esta app — en `web/`
- **Horarios**: L–S, franjas 7am, 12pm, 5pm (COL)

## 👥 Estudiantes de referencia (base histórica)

> Los siguientes estudiantes pertenecen a una base de datos antigua. Se incluyen únicamente como **ejemplo y modelo de construcción** para el desarrollo de materiales y perfiles de futuros estudiantes. No son estudiantes activos.

| Estudiante | Nivel | Enfoque | Paquete | Desde |
|-----------|-------|---------|---------|-------|
| Andrés Carrillo | B1 | Energía solar / tecnología | Semi Intensivo | 2025 |
| Milena Bautista | B1 | Innovación social en salud | Semi Intensivo | 2025 |
| Jenifer | B1 | Bienes raíces / vida diaria | Semi Intensivo | 2025 |
| Luciana Castañeda (Kids) | A1 | Refuerzo escolar | Básico | 2025 |
| Nico & Juanita | A2 | Conversación y confianza | Básico | 2025 |
| Gabriela (Yoga) | B2 | Speaking fluido | Semi Intensivo | 2025 |

## 📊 Indicadores actuales
- **Total estudiantes**: 0 (reinicio de base de datos; 2 cuentas demo ACTIVAS para pruebas F4)
- **Leads en WhatsApp**: 0 (sin campaña activa; 5 leads DEMO en el CRM local)
- **Ingresos mensuales estimados**: $0 COP (pagos DEMO locales)
- **Clases/semana**: 0
- **Web publicada**: No (app Vite+React en local; API del LMS local en `web/server/`, puerto 4000)
- **Redes sociales**: No activas

## 📋 Tareas activas (siguientes pasos)
> Nota: publicar la web está DESCARTADO hasta cerrar F4 del plan LMS (criterios en `docs/PLAN LMS ACN INSTITUTE.md` sección B).
1. [x] Fase 1 LMS: bootstrap backend (Prisma+SQLite+Express) — COMPLETADA (2026-08-02)
2. [x] Fase 1 LMS: schema 17 entidades + seed DEMO (6 históricos INACTIVE, 6 matrículas esDemo, 5 paquetes) — COMPLETADA
3. [x] Fase 1 LMS: 54 endpoints REST + JWT por rol + prueba de humo 38/38 — COMPLETADA
4. [x] Fase 2 LMS: módulos estudiante/profesor/admin (21 páginas) + 7 endpoints nuevos + seed ampliado + 2 cuentas demo ACTIVAS — COMPLETADA (2026-08-03)
5. [ ] Fase 3: integraciones (Wompi sandbox, agenda, ElevenLabs, RAG)
6. [ ] Fase 4: pruebas internas con cuentas DEMO (profesora/estudiante demo ACTIVAS)
7. [ ] (F5, cuando se autorice) Publicar web: dominio, Vercel/Netlify, WhatsApp real, SEO
8. [ ] Reemplazar wa.me/57 con número real de WhatsApp
9. [ ] Crear Google Business Profile
10. [ ] Configurar Calendly para clase diagnóstico
11. [ ] Iniciar calendario editorial Instagram/TikTok
12. [ ] Imprimir folletos y tarjetas
13. [ ] Implementar Wompi como pasarela de pago

## 🛠️ Stack tecnológico
| Herramienta | Estado | Notas |
|------------|--------|-------|
| Web (Vite+React) | LMS Fases 1+2 COMPLETAS | API Express 5 + SQLite + Prisma 6 en `web/server/` (61 endpoints). Vía A confirmada. Ver `docs/ARQUITECTURA.md` |
| WhatsApp Business | No configurado | Pendiente crear perfil comercial |
| Google Workspace | No | Pendiente (correo corporativo) |
| Canva Pro | Sí | En uso |
| ElevenLabs | Sí | Para audios de listening |
| Freepik/Magnific | Sí | Imágenes IA |
| Wompi | No | Recomendado para pagos web |
| Calendly | No | Para agendar clase diagnóstico |
| Instagram/TikTok | No creadas | Pendiente crear cuentas corporativas |

## 📄 Documentos clave
- `docs/PLAN LMS ACN INSTITUTE.md` — Plan del LMS (93 tareas, 5 fases) — NO publicar web hasta F4 cerrada
- `docs/ARQUITECTURA.md` — Decisión de stack (Vía A), esquema 17 modelos, contrato API (54 endpoints), seed DEMO, prueba de humo F1
- `docs/ESTRATEGIA COMERCIAL - ACN INSTITUTE ONLINE.md` — Plan de ventas y lanzamiento
- `web/` — Código fuente de la web (frontend Vite+React; API en `web/server/`)
- `Students 2025/` — Material de cada estudiante
- `Paquete de Clases de Speaking – Conversación Guiada.docx` — Oferta comercial
- `Plan de Negocio - ACN Institute.docx` — Plan de negocio original

## 🚨 Problemas/bloqueos conocidos
- La directora es la única docente — no puede escalar más allá de ~15 estudiantes sin contratar
- Los pagos son manuales (Nequi/Davivienda) — no hay dashboard financiero
- La web tiene placeholders de WhatsApp (wa.me/57) — no conecta al número real
- No hay CRM — los leads se gestionan manualmente en WhatsApp

> Nota: Las tareas activas se priorizan a partir de `docs/checklist-acn.md`. El Agente Director debe revisar ese archivo y mover aquí solo las tareas en curso o inmediatas.

## 👤 Cuentas demo ACTIVAS (para pruebas F4)
| Cuenta | Rol | Contraseña |
|---|---|---|
| `andrea@acninstitute.com` | ADMIN | `Demo123!` |
| `profesora.demo@acn.com` | TEACHER | `Demo123!` |
| `estudiante.demo@acn.com` | STUDENT | `Demo123!` |

> Credenciales completas y reglas del seed en `docs/ARQUITECTURA.md` sección 7.