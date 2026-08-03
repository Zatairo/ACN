# AGENTS.md

## Project Context

US-Learn: plataforma personalizada de inglés (React + Vite + Tailwind, shadcn/ui). Aplicación de código propiedad del usuario; mantener cambios enfocados y preservar las convenciones existentes.

La app funciona **sin backend ni plataforma externa**: `src/api/base44Client.js` implementa un backend local (auth, entidades, LLM e imágenes simulados) sobre `localStorage`, con la misma API que el SDK de Base44 (`db.auth.*`, `db.entities.*`, `db.integrations.Core.*`).

## Key Files

- `src/`: código fuente de la aplicación.
- `src/api/base44Client.js`: backend local (auth, entidades Lesson/StudentProfile, `InvokeLLM`/`GenerateImage` simulados). Toda persistencia vive en claves `uslearn_*` de `localStorage`.
- `src/lib/AuthContext.jsx`: contexto de autenticación (usa `db.auth`).
- `vite.config.js`: config de Vite (alias `@/*` → `./src/*`).
- `base44_entities_*.jsonc`: esquemas de referencia de las entidades (mantener sincronizados con el cliente).

## Working Notes

- Comando de desarrollo: `npm run dev` (Vite). No hay backend que levantar.
- El flujo demo: registrar (el código OTP se muestra en un diálogo local), onboarding (perfil + nivelación), generar lección desde `/` (las 10 actividades se generan localmente, sin llamadas a servicios externos).
- Los datos se borran limpiando el `localStorage` del navegador.
- Ejecutar `npm run lint` y `npm run build` antes de terminar cambios de código.
