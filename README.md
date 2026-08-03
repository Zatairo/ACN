# ACN Institute — Inglés con Propósito

![ACN Institute](https://img.shields.io/badge/ACN-Institute-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-18-61DAFB)
![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4)
![License](https://img.shields.io/badge/License-UNLICENSED-red)

**ACN Institute** es un instituto de inglés 100% virtual, colombiano, con metodología comunicativa y clases privadas personalizadas por nivel MCER (A1–C1). Fundado y dirigido por Andrea, con un equipo de 7 agentes opencode que operan 24/7.

Este repositorio contiene todo el material del instituto: plan de negocio, estrategia comercial, materiales de estudiantes, + una web app (React + Vite + Tailwind) para la plataforma de aprendizaje.

---

## Estructura del repositorio

```
ACN/
├── AGENTS.md              # Instrucciones para agentes opencode (raíz)
├── opencode.json          # Configuración de agentes opencode
├── .gitignore             # Exclusiones del repo
│
├── docs/                  # Documentación estratégica y legal
│   ├── ESTRATEGIA COMERCIAL - ACN INSTITUTE ONLINE.md
│   └── checklist-acn.md   # Checklist de creación del sistema completo
│
├── ops/                   # Archivos operativos (compartidos entre agentes)
│   ├── ESTADO DEL PROYECTO.md  # Estado actual, KPIs, tareas activas
│   └── LEADS.md           # Registro de prospectos
│
├── .opencode/             # Configuración interna de agentes opencode
│   └── agent/
│       ├── director.md    # Coordinador general
│       ├── ventas.md      # Funnel de ventas y leads
│       ├── soporte.md     # Atención al estudiante
│       ├── finanzas.md    # Contabilidad y finanzas
│       ├── webdev.md      # Desarrollo web
│       ├── contenido.md   # Redes sociales y copywriting
│       └── didactica.md   # Material didáctico
│
├── web/                   # Aplicación web (React + Vite + shadcn/ui)
│
├── Students 2025/         # Material de ejemplo (base de datos histórica para referencia)
│   ├── Andres Carrillo/        # B1 — Energía solar / Tecnología
│   ├── Jenifer English for life/  # B1 — Bienes raíces
│   ├── Luciana Castañeda/      # A1 — Kids
│   ├── Milena Bautista_/       # B1 — Innovación social en salud
│   ├── Nico y Juanita/         # A2 — Conversación
│   └── Yoga_ (Gabriela)/       # B2 — Speaking fluido
│
├── ACN, Mentor Mateo/     # Mentoría
├── Andrea_/               # Material personal de Andrea (fundadora)
├── PLATFORMS WEBS_/      # Notas sobre plataformas web
│
# Documentos comerciales raíz (.docx)
├── ACN INSTITUTE.docx                          # Info general del instituto
├── Plan de Negocio - ACN Institute.docx        # Plan de negocio original
├── Paquete de Clases de Speaking – Conversación Guiada.docx  # Oferta comercial
├── Copy of Paquete de Clases de Speaking – Conversación Guiada.docx
├── Services- Andres.docx                       # Servicios a estudiantes
├── Presentation-Lesson-3-Video-2 (10).pdf      # Presentación institucional
└── cuaderno inglés Lucy .pdf                   # Material de estudiante
```

---

## Datos del instituto

| Aspecto | Detalle |
|---------|---------|
| **Nombre** | ACN Institute (Inglés con Propósito) |
| **Fundadora** | Andrea (perfil docente y directivo) |
| **País** | Colombia (hispanohablantes) |
| **Metodología** | Comunicativa, 100% personalizada, MCER A1–C1 |
| **Duración clase** | 45 minutos |
| **Modalidad** | Zoom / Google Meet |
| **Horarios** | L–S, franjas 7am, 12pm, 5pm (COL) |
| **Pagos** | Nequi, Davivienda (próximamente: Wompi) |

### Paquetes y precios

| Paquete | Clases | Precio COP | Precio/clase |
|---------|--------|-----------|-------------|
| Básico | 8/mes (2/sem) | $360.000 | $45.000 |
| Semi Intensivo | 12/mes (3/sem) | $510.000 | $42.500 |
| Bimestral ☆ | 16 en 2 meses (2/sem) | $680.000 | $42.500 |
| Semi Intensivo Plus | 24 en 2 meses (3/sem) | $990.000 | $41.250 |
| Trimestral | 36 en 3 meses (3/sem) | $1.350.000 | $37.500 |

---

## Estudiantes de referencia (base histórica)

> Los siguientes estudiantes pertenecen a una base de datos antigua. Se incluyen únicamente como **ejemplo y modelo de construcción** para el desarrollo de materiales y perfiles de futuros estudiantes. No son estudiantes activos.

| Estudiante | Nivel | Enfoque | Paquete | Desde |
|-----------|-------|---------|---------|-------|
| Andrés Carrillo | B1 | Energía solar / tecnología | Semi Intensivo | 2025 |
| Milena Bautista | B1 | Innovación social en salud | Semi Intensivo | 2025 |
| Jenifer | B1 | Bienes raíces / vida diaria | Semi Intensivo | 2025 |
| Luciana Castañeda (Kids) | A1 | Refuerzo escolar | Básico | 2025 |
| Nico & Juanita | A2 | Conversación y confianza | Básico | 2025 |
| Gabriela (Yoga) | B2 | Speaking fluido | Semi Intensivo | 2025 |

---

## Web App (`web/`)

Plataforma personalizada de aprendizaje de inglés construida con **React 18 + Vite 6 + Tailwind CSS 3 + shadcn/ui**.

### Stack

- **Frontend**: React 18, React Router 6, TanStack React Query, Framer Motion
- **Estilos**: Tailwind CSS 3, shadcn/ui (Radix primitives)
- **Backend**: Ninguno — la app funciona 100% local en el navegador usando `localStorage`
- **Auth**: OTP simulado + Google demo login
- **Build**: Vite 6, TypeScript, ESLint

### Características principales

- **Landing pública**: Página principal con CTA a paquetes, nivelación y práctica
- **Niveles CEFR**: A1–C1 públicos
- **Planes/Precios**: Vista de paquetes con precios en COP
- **Examen de nivelación**: Test interactivo de nivelación CEFR
- **Perfil RAG**: Los estudiantes crean un perfil con su contexto personal/profesional
- **Motor de lecciones**: Lecciones personalizadas con 10 actividades interactivas generadas localmente
- **Dashboard**: Progreso del estudiante, biblioteca de lecciones
- **Actividades interactivas**:
  - AI Roleplay (juego de roles)
  - Fill the Gaps (completar espacios)
  - Hangman (ahorcado)
  - Image to Word (imagen a palabra)
  - Reading Comprehension (comprensión lectora)
  - Sentence Scramble (ordenar oraciones)
  - Transcriptor (transcripción)
  - Visual Storytelling (narración visual)
  - Vocabulary in Context (vocabulario en contexto)
  - Word Search (sopa de letras)
- **Idioma**: Selector ES/EN
- **Marca**: Identidad visual rojo/blanco/azul (estilo EE.UU.)

### Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | Inicio — generar nueva lección |
| `/register` · `/login` | Registro con OTP y login |
| `/onboarding` | Perfil RAG + examen de nivelación |
| `/lesson/:id` | Motor de lecciones (10 actividades) |
| `/sample-lesson` | Lección de ejemplo B1 |
| `/my-lessons` · `/dashboard` | Biblioteca y progreso |
| `/word-search` · `/fill-in-the-blanks` | Juegos de práctica |
| `/profile` | Editar perfil de personalización |

### Comandos (ejecutar dentro de `web/`)

```bash
npm install
npm run dev        # Servidor de desarrollo (Vite)
npm run build      # Build de producción
npm run preview    # Previsualizar build
npm run lint       # ESLint
npm run typecheck  # TypeScript check
```

### ¿Cómo funciona sin backend?

La app usa `src/api/base44Client.js` que implementa un backend 100% local sobre `localStorage`:

- `db.auth.*` — Autenticación con OTP simulado (el código se muestra en un diálogo)
- `db.entities.Lesson` / `db.entities.StudentProfile` — CRUD con aislamiento por usuario
- `db.integrations.Core.InvokeLLM` / `GenerateImage` — Generación simulada de lecciones e imágenes SVG

No requiere variables de entorno ni servicios externos.

---

## Sistema de Agentes Opencode

El instituto opera con **7 agentes opencode** que trabajan 24/7 coordinados por el Agente Director.

| Agente | Rol |
|--------|-----|
| **Director** | Coordina los demás agentes, genera reportes diarios, actualiza estado del proyecto |
| **Ventas** | Atrae leads, califica prospectos, da seguimiento vía WhatsApp |
| **Soporte** | Responde dudas 24/7, agenda clases, confirma pagos, resuelve incidencias |
| **Finanzas** | Lleva contabilidad, emite recibos, controla ingresos/gastos |
| **Web Dev** | Mantiene la web, corrige bugs, implementa nuevas funcionalidades |
| **Contenido** | Crea contenido para redes sociales, copywriting, calendario editorial |
| **Didáctica** | Crea material didáctico (conversaciones guiadas, audios, ejercicios) |

### Comandos personalizados

| Comando | Descripción |
|---------|-------------|
| `/reporte` | Genera reporte ejecutivo del estado del proyecto |
| `/estado` | Muestra resumen rápido (estudiantes, ingresos, tareas) |
| `/plan-dia` | Asigna las 3 tareas más importantes del día a los agentes |
| `/nuevo-lead <datos>` | Registra un nuevo lead en `ops/LEADS.md` |

---

## Estado actual y roadmap

**Indicadores** (agosto 2026):

| Indicador | Valor |
|-----------|-------|
| Estudiantes activos | 0 (reinicio de base de datos) |
| Ingresos mensuales | $0 COP |
| Clases/semana | 0 |
| Web publicada | No (compila OK, 12 rutas) |
| Leads en WhatsApp | 0 (sin campaña activa) |
| Redes sociales | No activas |

**Próximos pasos prioritarios:**

1. Publicar web en Vercel/Netlify
2. Reemplazar wa.me/57 con número real de WhatsApp
3. Crear Google Business Profile
4. Configurar Calendly para clase diagnóstico
5. Iniciar calendario editorial Instagram/TikTok
6. Implementar Wompi como pasarela de pago web

---

## Metas a 12 meses (proyección desde cero)

> Metas comerciales proyectadas para el relanzamiento, partiendo de 0 estudiantes activos.

| Indicador | Mes 3 | Mes 6 | Mes 12 |
|-----------|-------|-------|--------|
| Leads WhatsApp | +30/mes | +60/mes | +100/mes |
| Tasa conversión | 20% | 25% | 30% |
| Estudiantes activos | 12 | 20 | 30 |
| Ingresos mensuales | $4.5M COP | $7.5M COP | $12M COP |
| Clases/mes | 120 | 200 | 320 |
| Retención mensual | 80% | 85% | 90% |

---

## Documentos clave

- `docs/ESTRATEGIA COMERCIAL - ACN INSTITUTE ONLINE.md` — Plan de ventas y Roadmap 90 días
- `docs/checklist-acn.md` — Checklist completo del sistema ACN (142 ítems)
- `ops/ESTADO DEL PROYECTO.md` — Estado actualizado del proyecto (agentes lo actualizan)
- `ops/LEADS.md` — Registro de prospectos
- `web/README.md` — Documentación técnica de la web app
- `web/AGENTS.md` — Instrucciones para agentes sobre la web
- `Plan de Negocio - ACN Institute.docx` — Plan de negocio original
- `Paquete de Clases de Speaking – Conversación Guiada.docx` — Oferta comercial

---

## Notas técnicas

- Los archivos `.docx` y `.pdf` son binarios — no se pueden leer con herramientas de texto directamente. Usar `pandoc` o `python-docx` para convertirlos.
- Los nombres de archivo contienen caracteres no ASCII (tildes, eñes). En PowerShell usar `-LiteralPath`.
- La web usa `localStorage` — los datos persisten en el navegador. Se borran limpiando `localStorage`.
- Los precios en COP están sincronizados con `Services- Andres.docx`.
- Temas CEFR según `ACN INSTITUTE.docx`.
- `node_modules/` y `web/dist/` están en `.gitignore`.

---

*Última actualización: agosto 2026*