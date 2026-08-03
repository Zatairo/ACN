---
name: translate-page
description: Traduce una página o componente al idioma contrario (ES↔EN). Añade claves faltantes en el diccionario i18n del proyecto.
license: MIT
compatibility: opencode
---

## Qué hace
Toma una página o componente y se asegura de que todos sus textos estén en ambos idiomas (ES y EN) en el sistema i18n del proyecto.

## Cómo usarla
Pasa la ruta del archivo: `@translate-page traduce src/app/niveles/page.tsx`

## Flujo
1. Lee `src/lib/i18n.ts` para entender el tipo `Dictionary` y los diccionarios `es`/`en`
2. Escanea el archivo en busca de:
   - Textos hardcodeados (deben migrarse a t(...))
   - Claves `t(...)` que falten en uno de los idiomas
3. Para cada texto hardcodeado:
   - Crea clave en i18n.ts con nombre descriptivo
   - Traduce ES↔EN
4. Para claves faltantes: completa la traducción en el idioma que falta
5. No traduzcas: nombres propios (ACN Institute), términos CEFR (A1–C1), variables de código

## Reglas
- Mantén el tipo `Dictionary` sincronizado: toda nueva clave debe existir en ES y EN
- Después de editar i18n.ts, corre `npm run build` para verificar TypeScript