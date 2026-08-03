---
name: add-page
description: Crea una nueva página/ruta en el proyecto siguiendo el patrón existente (App Router, cliente bilingual, layout del proyecto).
license: MIT
compatibility: opencode
---

## Qué hace
Crea una página nueva en `src/app/<ruta>/page.tsx` siguiendo las convenciones del proyecto: `"use client"`, sistema i18n, componentes existentes, paleta de colores.

## Cómo usarla
Indica la ruta (ej: "contacto") y qué debe mostrar la página.

## Flujo
1. Lee el AGENTS.md para entender la arquitectura (App Router, i18n, store, paleta)
2. Lee una página existente similar (ej: `src/app/niveles/page.tsx` o `src/app/practicar/page.tsx`) como template
3. Crea `src/app/<ruta>/page.tsx`:
   - `"use client"` al inicio
   - Importa `useLanguage` desde `src/components/language-provider.tsx`
   - Usa componentes existentes (header, footer, sections)
   - Respeta la paleta: blanco `#FFFFFF`, rojo `#B22234`, azul `#3C3B6E`
   - No hardcodees textos — usa `t(...)` con claves i18n
4. Si la página necesita nuevas claves de traducción, actualiza `src/lib/i18n.ts` (ES + EN)
5. Si necesita datos o lógica, usa `src/lib/store.ts` para persistencia
6. Añade enlace en header/footer si corresponde
7. Verifica `npm run build`

## Reglas
- No dupliques rutas existentes (revisa `src/app/`)
- Si la funcionalidad ya existe en otro lado, reutiliza componentes
- Sigue el patrón de las páginas existentes exactamente