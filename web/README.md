# US-Learn · Plataforma de Inglés

App web (React + Vite + Tailwind) de US-Learn, plataforma personalizada de enseñanza de inglés para estudiantes de ACN Institute (Colombia). Los estudiantes crean su perfil (RAG), se nivelan por CEFR (A1–C1) y generan lecciones con 10 actividades interactivas personalizadas a su vida y profesión.

## ¿Cómo funciona?

La app usa un backend 100 % local (navegador, `localStorage`) que reemplaza a la plataforma Base44:

- `src/api/base44Client.js` — cliente `db` con la misma API que el SDK de Base44:
  - `db.auth.*` — registro con OTP (el código se muestra en un diálogo de demostración), login, login demo con Google, restablecimiento de contraseña.
  - `db.entities.Lesson` / `db.entities.StudentProfile` — CRUD con aislamiento por usuario (`created_by_id`).
  - `db.integrations.Core.InvokeLLM` / `GenerateImage` — generación simulada: lecciones completas con las 10 actividades, ejercicios de completar frases, listas de vocabulario e imágenes placeholder en SVG (sin servicios externos).
- Sin variables de entorno ni `.env.local`: nada que configurar.

Los datos viven en las claves `uslearn_*` del `localStorage` del navegador.

## Comandos

```bash
npm install
npm run dev        # servidor de desarrollo (Vite)
npm run build      # build de producción
npm run lint       # eslint
npm run preview    # previsualizar el build
```

## Rutas

| Ruta | Descripción |
| --- | --- |
| `/register` · `/login` | Registro con OTP y login (email o Google demo) |
| `/onboarding` | Paso 1: perfil (RAG) · Paso 2: examen de nivelación CEFR |
| `/` | Inicio: generar nueva lección personalizada con 10 actividades |
| `/lesson/:id` | Motor de lecciones (10 actividades, 7/10 para dominar) |
| `/sample-lesson` | Lección de ejemplo B1 |
| `/my-lessons` · `/dashboard` | Biblioteca de lecciones y progreso |
| `/word-search` · `/fill-in-the-blanks` | Juegos de práctica |
| `/profile` | Editar contexto de personalización |

## Estructura

```
src/
  api/base44Client.js      # backend local (auth, entidades, LLM/imágenes simulados)
  lib/                     # AuthContext, progresión CEFR, TTS, generador de sopas
  pages/                   # una página por ruta
  components/
    activities/            # 10 actividades interactivas
    lesson/LessonEngine.jsx
    onboarding/            # perfil + nivelación
    ui/                    # shadcn/ui
```
