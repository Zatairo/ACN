# AGENTS.md

## What this is

Document archive + software for ACN Institute (an English-teaching business, Spanish-speaking staff/students). The repo is `Zatairo/ACN` on GitHub; code lives in `web/`. **Stack real verificada: Vite 6 + React 18 + Tailwind (frontend) y Express 5 + Prisma + SQLite (API en `web/server/`). NO es Next.js** (los docs antiguos decían Next.js 16, corregido en `docs/PLAN LMS ACN INSTITUTE.md`).

## File formats

All archive content is binary Office formats (`.docx`, `.pdf`). Standard tools fail on them:

- `grep`/`glob`/`read`/`edit` cannot parse file contents; filenames are the only searchable text.
- Do NOT try to read or edit a `.docx` with text-based file tools — it is a ZIP of XML. Use a converter instead, e.g. `pandoc file.docx -t markdown` or a `python-docx` script.
- Avoid adding text alongside existing files unless you also handle the binary format (e.g. via `python-docx`, which is not guaranteed to be installed — check first).
- Filenames contain non-ASCII characters (e.g. "Conversación Guiada", "cuaderno inglés Lucy"); use `-LiteralPath`/proper quoting in PowerShell.

## Layout

- Root: business and shared documents — class packages (`Paquete de Clases de Speaking – Conversación Guiada.docx`), service lists (`Services- Andres.docx`), platform notes (`PLATFORMS WEBS_/PLATFORMS_.docx`), business plan (`Plan de Negocio - ACN Institute.docx`).
- `Students 2025/`: one folder per student (historical reference data — these are not active students, only examples for future material development), each with monthly subfolders (`First month/`, `Second month/`, ...) plus a per-student speaking package.
- `ACN, Mentor Mateo/`, `Andrea_/`: individual mentor/student materials.
- Spanish is the working language for internal notes; English is the subject matter. Preserve language of existing documents.

## Web app (`web/`)

The only code in this archive: a **Vite 6 + React 18 + Tailwind** website for ACN Institute — landing, levels (CEFR A1–C1), plans/pricing, interactive practice activities, placement test, personalized lesson engine (RAG profile → 4 pillars), dashboard, students area, with an ES/EN language selector and US-style red/blue/white identity. Backend del LMS: Express 5 + Prisma + SQLite en `web/server/`.

- See `web/AGENTS.md` for the project's own instructions (there is also a `web/gitignore.txt` reference file; the active ignore rules are the root `.gitignore`).
- Commands (run inside `web/`): `npm run dev`, `npm run build`, `npm run start`, `npm run lint`; API: `npm run dev:api` (puerto 4000).
- Business data (levels, plans, students, exercises) and the i18n dictionaries live in `src/lib/` (`data`, `i18n`, `brand.ts`). Prices in COP come from `Services- Andres.docx`; CEFR topics from `ACN INSTITUTE.docx`; keep them in sync when those docs change.

---

## 🤝 Coordinación multi-agente (opencode en PC + Hermes en servidor)

**Tablero en vivo = GitHub Issues del repo** (`Zatairo/ACN`). Este archivo de coordinación es OBLIGATORIO para todos los agentes. Ver `docs/ARQUITECTURA.md` y `ops/ESTADO DEL PROYECTO.md` para contexto técnico.

### Fuentes de verdad (no hay dos)
1. **Qué HAY QUE HACER** → GitHub Issues: https://github.com/Zatairo/ACN/issues
2. **Qué está CONSTRUIDO/estado** → `ops/ESTADO DEL PROYECTO.md` (se actualiza al cerrar cada tarea).
3. **Cómo construir** → `docs/PLAN LMS ACN INSTITUTE.md`, `docs/ARQUITECTURA.md`, `docs/MANUAL DE MARCA.md`, `web/AGENTS.md`.

Regla de oro: **nadie trabaja algo que no esté en el tablero.** Antes de empezar: leer tablero + estado. Al terminar: actualizar estado + cerrar el issue.

### Scopes por etiqueta (dueño de cada tarea)
| Etiqueta | Quién trabaja | Qué incluye |
|---|---|---|
| `hermes` | Solo el agente **Hermes** (servidor 192.168.1.56, job 24/7) | Backend/API/Prisma/integraciones, build autónomo |
| `opencode` | Solo los agentes **opencode** (PC local) | Frontend/UI, marca, contenido web, tareas rápidas |
| `humano` | Requiere intervención humana | Cuentas, credenciales, decisiones, aprobaciones |
| Prioridad | `P0` > `P1` > `P2` | Severidad/urgencia |
| Fase | `fase1`..`fase5`, `negocio` | Plan del LMS / negocio |

**Cada agente trabaja SOLO tareas de su etiqueta.** No tocar el scope de otro (evita pisarse).

### Protocolo de trabajo (obligatorio)
1. `git pull origin main`.
2. Consultar el tablero de TU scope: `bash ops/tablero.sh hermes` (o `opencode`/`humano`), o `gh issue list -R Zatairo/ACN -L 50`.
3. Elegir el issue abierto de mayor prioridad de tu scope; comentarlo/reclamarlo (asignarse o marcar en progreso).
4. Leer estado y docs vinculados (el issue referencia la tarea del plan).
5. Trabajar: commits pequeños y descriptivos. Antes de push: `git pull --rebase`.
6. Al terminar: actualizar `ops/ESTADO DEL PROYECTO.md` (fecha + log), actualizar/cerrar el issue con resumen, y `git push origin main`.
7. Reportar por el canal que el humano tenga configurado (Hermes → Telegram).

### Tablero
`bash ops/tablero.sh [scope]` lista issues abiertos (usa el token que ya está en la URL del remote; no imprimas tokens).
