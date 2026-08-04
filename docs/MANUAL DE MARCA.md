# Manual de Marca — ACN Institute

> **Inglés con Propósito**  
> Documento de referencia oficial para todo el equipo, agentes y colaboradores.  
> Última actualización: 2026-08-02

---

## 1. Origen y concepto

ACN Institute nace de la visión de Andrea: crear un instituto virtual de inglés donde cada clase transmita la **paz, la felicidad, la inspiración y la concentración de un atardecer**.

- **Nombre**: ACN Institute
- **Frase clave**: Inglés con Propósito
- **Concepto visual**: Atardecer — tonos cálidos que evocan calma y motivación.
- **Público objetivo**: Hispanohablantes colombianos, profesionales de 25 a 45 años, con metas concretas (trabajo, viajes, crecimiento).
- **Tono de voz**: Cercano, inspirador, profesional. Evitar jerga innecesaria; hablarle a la persona, no al "estudiante genérico".

---

## 2. Identidad cromática

La paleta se basa en una identidad rojo / azul / blanco, usada de forma equilibrada.

| Rol | Nombre | Hex | HSL | Uso principal |
|-----|--------|-----|-----|---------------|
| Azul principal | `brand-blue` | `#3C3B6E` | `241 30% 33%` | Navegación, títulos, botones primarios, identidad |
| Rojo institucional | `brand-red` | `#B22234` | `0 68% 42%` | CTAs, badges, acentos, llamadas a la acción |
| Blanco | `brand-white` | `#FFFFFF` | `0 0% 100%` | Fondos, espacio negativo, contraste |
| Negro texto | `foreground` | `#1A1A2E` | `241 30% 10%` | Texto principal |
| Gris neutro | `muted` | `#F5F5F5` | `0 0% 96.1%` | Fondos secundarios, bordes |

### Reglas de uso

- **Fondos**: Preferir blanco o `muted`. Evitar fondos saturados.
- **Contraste**: Texto sobre `brand-blue` o `brand-red` debe ser blanco (`#FFFFFF`).
- **Accesibilidad**: Nunca usar `brand-red` sobre fondo rojo, ni `brand-blue` sobre fondo azul.
- **Jerarquía**: `brand-blue` > `brand-red` > `brand-white` > `muted`.

### Tokens CSS (variables)

```css
--brand-red: 0 68% 42%;
--brand-red-foreground: 0 0% 100%;
--brand-blue: 241 30% 33%;
--brand-blue-foreground: 0 0% 100%;
--brand-white: 0 0% 100%;
--brand-white-foreground: 241 30% 10%;
```

### Tokens Tailwind

```ts
'brand-red': 'hsl(var(--brand-red))',
'brand-red-foreground': 'hsl(var(--brand-red-foreground))',
'brand-blue': 'hsl(var(--brand-blue))',
'brand-blue-foreground': 'hsl(var(--brand-blue-foreground))',
'brand-white': 'hsl(var(--brand-white))',
'brand-white-foreground': 'hsl(var(--brand-white-foreground))',
```

---

## 3. Tipografía

La tipografía transmite cercanía y profesionalismo. Se usan dos familias:

| Rol | Familia | Uso |
|-----|---------|-----|
| Títulos / Display | **Poppins** (weights: 600, 700, 800) | Encabezados, logo, nombres, CTAs grandes |
| Cuerpo / Texto | **Inter** (weights: 400, 500, 600) | Párrafos, formularios, navegación, UI |

### Escala tipográfica

| Elemento | Tamaño | Peso | Tracking |
|----------|--------|------|----------|
| Display (hero) | 3rem / 48px | 800 | -0.02em |
| Título H1 | 2.25rem / 36px | 700 | -0.01em |
| Título H2 | 1.5rem / 24px | 700 | 0 |
| Título H3 | 1.25rem / 20px | 600 | 0 |
| Cuerpo grande | 1.125rem / 18px | 400 | 0 |
| Cuerpo base | 1rem / 16px | 400 | 0 |
| Cuerpo pequeño | 0.875rem / 14px | 500 | 0.01em |
| Etiqueta / badge | 0.75rem / 12px | 600 | 0.05em uppercase |

### Tokens CSS

```css
--font-heading: 'Poppins', ui-sans-serif, system-ui, sans-serif;
--font-body: 'Inter', ui-sans-serif, system-ui, sans-serif;
--font-display: 'Poppins', ui-sans-serif, system-ui, sans-serif;
--font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
```

---

## 4. Isotipo y logo

### Isotipo

El isotipo es la representación gráfica mínima de ACN Institute. Se inspira en el **atardecer**:

- Forma: círculo dividido horizontalmente.
- Mitad superior: `brand-red` (sol poniente).
- Mitad inferior: `brand-blue` (cielo al anochecer).
- Línea de separación: curva blanca suave, simulando el horizonte.

Usos del isotipo: favicon, avatar de app, iconos de sección, watermark.

### Logo (wordmark)

El logo combina el isotipo con el nombre de la marca.

- **Favicon / icono**: solo isotipo.
- **Header / app**: isotipo a la izquierda + "ACN Institute" en Poppins 700.
- **Horizontal completo**: isotipo + "ACN Institute" + "Inglés con Propósito" (tagline opcional, Inter 500, 10px, tracking wider).

### Archivos

| Archivo | Formato | Uso |
|---------|---------|-----|
| `public/brand/isotipo.svg` | SVG | Favicon, app icon, avatar |
| `public/brand/logo.svg` | SVG | Header, footer, documentos |
| `public/brand/logo-horizontal.svg` | SVG | Material impreso, banners |

### Reglas de protección

- No estirar, deformar ni rotar el logo.
- No cambiar los colores oficiales.
- No colocar el logo sobre fondos que reduzcan contraste (si el fondo es oscuro, usar la versión en blanco).
- Mantener espacio libre alrededor del logo igual a la altura de la letra "A" del isotipo.

---

## 5. Espaciado y layout

- **Grid base**: 8px (0.5rem).
- **Contenedores**: `max-w-6xl` con padding lateral responsivo (`px-4 sm:px-6`).
- **Radios**: `--radius: 0.5rem` para botones, tarjetas y inputs. `rounded-2xl` o `rounded-3xl` para secciones hero.
- **Sombras**: sutiles (`shadow-md` en elementos interactivos, `shadow-lg` en modales).

---

## 6. Componentes de marca

### Botones

| Variante | Fondo | Texto | Uso |
|----------|-------|-------|-----|
| Primary | `brand-blue` | blanco | Acciones principales |
| Accent | `brand-red` | blanco | CTAs, ofertas, urgency |
| Outline | transparente | `brand-blue` | Acciones secundarias |
| Ghost | transparente | `brand-blue` | Navegación, iconos |

### Badges / Chips

- Nivel del estudiante: `brand-red` fondo, texto blanco, `rounded-full`, `text-xs font-bold`.
- Estado: `brand-blue/10` fondo, texto `brand-blue`, `rounded-md`.

### Tarjetas

- Fondo: blanco.
- Borde: `border-slate-100`.
- Hover: `hover:border-brand-blue`.
- Radio: `rounded-2xl`.

---

## 7. Tono de voz

- **Cercano**: Usar "tú" y "tu clase", no "el estudiante" ni "usted" (salvo comunicaciones formales).
- **Inspirador**: Verbos de acción. "Genera tu lección", "Empieza hoy", "Transforma tu inglés".
- **Profesional**: Sin slang, sin errores de redacción, sin mayúsculas decorativas excesivas.
- **Propósito**: Cada mensaje debe conectar el inglés con una meta real (reunión, viaje, entrevista).

### Ejemplos

| Correcto | Incorrecto |
|----------|------------|
| "Clases privadas a tu ritmo" | "Clases super baratas" |
| "Inglés para tu trabajo" | "Aprende inglés ya" |
| "Tu profesor te acompaña" | "Somos los mejores" |

---

## 8. Aplicaciones digitales

### Web app

- **Header**: isotipo + "ACN Institute" en `brand-blue`.
- **Fondo principal**: blanco.
- **Secciones hero**: gradiente `brand-blue` → tono más oscuro, con acentos en `brand-red`.
- **Links y hover**: `brand-red` para énfasis, `brand-blue` para navegación.

### Redes sociales

- Imágenes de perfil: isotipo sobre fondo blanco o degradado rojo→azul.
- Portadas: atardecer estilizado en rojo/azul, sin texto en zonas inseguras.
- Stories/reels: usar `brand-red` para textos superpuestos, `brand-white` para contraste.

### Material impreso

- Tarjetas: frente isotipo + nombre; reverso datos + frase "Inglés con Propósito".
- Folletos: portada con logo grande, interior fondos blancos, CTAs en `brand-red`.
- Colores: imprimir en CMYK equivalente a los hex definidos.

---

## 9. Naming y términos

| Término | Definición |
|---------|-----------|
| ACN Institute | Nombre oficial de la marca |
| Inglés con Propósito | Tagline / frase clave |
| MCER | Marco Común Europeo de Referencia (niveles A1–C1) |
| Lección | Unidad personalizada de 10 actividades generada por IA |
| Perfil RAG | Perfil del estudiante (profesión, metas, nivel) usado para personalizar contenido |
| Paquete | Plan de clases: Básico, Semi Intensivo, Bimestral, etc. |

---

## 10. Recursos y archivos

- `src/index.css` — variables CSS de marca.
- `tailwind.config.js` — configuración de colores y fuentes.
- `src/lib/brand.ts` — tokens de marca para React.
- `public/brand/` — SVGs oficiales de logo e isotipo.
- `docs/MANUAL DE MARCA.md` — este documento.

---

## 11. Actualizaciones

Este manual es un documento vivo. Cualquier cambio en la identidad visual debe ser:

1. Propuesto por el Agente Web Dev o la Directora.
2. Documentado aquí antes de implementarse.
3. Comunicado a todos los agentes que generen contenido visual.
