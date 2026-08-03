# AGENTS.md

## What this is

Mostly a document archive for ACN Institute (an English-teaching business, Spanish-speaking staff/students), plus one Next.js web app. No git repo at the root. Do not look for manifests, tests, or CI at the root.

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

The only code in this archive: a Next.js (App Router, TypeScript, Tailwind) website for ACN Institute — landing, levels (CEFR A1–C1), plans/pricing, interactive practice activities, placement test, personalized lesson engine (RAG profile → 4 pillars), dashboard, students area, with an ES/EN language selector and US-style red/blue/white identity.

- See `web/AGENTS.md` for the project's own instructions (Next.js 16 has breaking changes vs older versions — read the local docs under `node_modules/next/dist/docs/` before writing code).
- Commands (run inside `web/`): `npm run dev`, `npm run build`, `npm run start`, `npm run lint`.
- Business data (levels, plans, students, exercises) and the i18n dictionaries live in `src/lib/data.ts` and `src/lib/i18n.ts`. Prices in COP come from `Services- Andres.docx`; CEFR topics from `ACN INSTITUTE.docx`; keep them in sync when those docs change.
