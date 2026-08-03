---
name: generate-lesson
description: Genera una lección completa (4 pilares + Use of English) para un nivel CEFR y tema. La integra en el sistema RAG del proyecto con perfil estudiante.
license: MIT
compatibility: opencode
---

## Qué hace
Crea o amplía una lección en el sistema RAG de ACN Institute: vocabulario A1→C1, párrafos de lectura, preguntas listening/writing/speaking, ejercicios Use of English.

## Cómo usarla
Indica: nivel (A1–C1), tema (ej: "business meetings", "family", "technology"), y opcionalmente perfil de estudiante (o usa juanProfile por defecto).

## Flujo
1. Lee `src/lib/lessons.ts` para entender la firma de `buildLesson` y estructura de lección
2. Lee `src/lib/db-schema.ts` para el tipo `Lesson` y sus campos
3. Lee `src/lib/i18n.ts` para ver claves de traducción existentes si aplica
4. Genera el contenido escalado al nivel CEFR:
   - Vocabulario (10-15 palabras con definiciones)
   - Párrafo de lectura (50-200 palabras según nivel)
   - Preguntas de comprensión (3-5)
   - Prompt de writing adaptado al perfil
   - Tema de speaking situacional
5. Si es nueva lección, añadir demo en `my-lessons/page.tsx`
6. Verificar que `npm run build` compila sin errores

## Reglas
- No rompas la firma de `buildLesson(profile, level, topic, id)` ni el tipo `Lesson`
- Complejidad progresiva: A1=frases simples/presente simple, C1=vocabulario avanzado/todos los tiempos
- Perfil demo: juanProfile (ingeniero, 40, Medellín, inglés corporativo)
- Contenido profesional, apropiado para instituto de inglés