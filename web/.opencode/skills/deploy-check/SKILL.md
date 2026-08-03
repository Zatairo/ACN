---
name: deploy-check
description: Verifica que el proyecto está listo para producción. Corre lint, build y revisa cambios no commiteados. Reporta blockers.
license: MIT
compatibility: opencode
---

## Qué hace
Ejecuta la batería de verificación pre-deploy: lint, build, git status, y revisión de cosas comunes que se olvidan.

## Cómo usarla
Solo invoca la skill: `@general skill deploy-check` o el agente la usa automáticamente antes del deploy.

## Flujo
1. Corre `npm run lint` y reporta errores
2. Corre `npm run build` y reporta errores
3. Revisa `git status` — verifica que no hay cambios sin commit
4. Verifica:
   - `AGENTS.md` actualizado
   - Links WhatsApp reemplazados (busca `wa.me/57` en el código)
   - No hay console.logs olvidados (grep por `console.log`)
   - Archivos sin usar (grep por imports huérfanos)
   - Diccionario i18n completo (mismas claves en ES y EN)
5. Reporta blockers (críticos) y warnings (menores) ordenados por prioridad

## Reglas
- No modifiques nada — solo reporta
- Si todo está verde, confirma que está listo para `git push && deploy`