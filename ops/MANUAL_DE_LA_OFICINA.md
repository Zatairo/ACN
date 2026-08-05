# MANUAL DE LA OFICINA — ACN Institute

> Guía práctica para operar la "oficina" de agentes autónomos de ACN.
> Servidor: 192.168.1.56 | Workspace: http://192.168.1.56:3100 | Repo: /home/soporte/proyectos/ACN

---

## 1. Modelo mental (2 reglas)

1. **Los agentes son "empleados"** con instrucciones fijas. No se programan con código: se les edita su *instrucción* (SOUL / prompt / misión).
2. **Solo hay 2 formas de que trabajen:**

| Forma | Qué es | Quién la usa |
|---|---|---|
| **Por horario (cron)** | Los agentes trabajan solos a su hora, sin que tú hagas nada. | 12 jobs "acn_*" + ACN-Build-24x7 |
| **Bajo demanda (kanban/swarm)** | Le das un objetivo y el **orquestador** divide, delega a los especialistas, y cada uno trabaja. | Perfiles del board `acn` + workers tmux |

---

## 2. Agentes en trabajo activo

### 2.1 Workers bajo demanda (6, tmux vivos)

| Worker | Rol | Perfil | Modelo (`:free`, $0) |
|---|---|---|---|
| `orchestrator` | Divide objetivos, delega a los especialistas, verifica evidencia y sintetiza | orchestrator | `nvidia/nemotron-3-ultra-550b-a55b:free` |
| `builder` | Implementa cambios concretos con evidencia (tests, diffs) | builder | `poolside/laguna-s-2.1:free` |
| `qa` | Verifica el trabajo (tests, smoke, calidad) | qa | `openai/gpt-oss-20b:free` |
| `frontend` | Frontend/UX/rendimiento (Web Vitals, builds, lint) | frontend | `poolside/laguna-xs-2.1:free` |
| `backend` | Backend/API/seguridad (OWASP, rate limiting) | backend | `poolside/laguna-s-2.1:free` |
| `docs` | Documentación y conocimiento del repo | docs | `google/gemma-4-26b-a4b-it:free` |

### 2.2 Cron jobs (13)

| Job | Horario | Rol | Deliver (Telegram) |
|---|---|---|---|
| `ACN-Build-24x7` | cada 6h | Issues GitHub etiquetados `hermes` → implementa en `web/`, commit/push, actualiza `ops/ESTADO DEL PROYECTO.md` | ACN-Tecnico |
| `acn_frontend` | 2:00 AM | Build + lint, Web Vitals (LCP<2.5s), code-splitting | ACN-Tecnico |
| `acn_backend` | 3:00 AM | Seguridad OWASP, rate limiting, revisión de commits | ACN-Tecnico |
| `acn_qa` | 4:00 AM | Suite de tests, cobertura ≥80% | ACN-Tecnico |
| `acn_ai` | 5:00 AM | Integración IA (ElevenLabs) | ACN-Negocio |
| `acn_docs` | Dom 6:00 AM | Actualizar ARQUITECTURA.md, ESTADO, manual de marca | ACN-Tecnico |
| `acn_finance` | 7:00 AM | Data/Finanzas (Google Sheets ↔ LMS) | ACN-Negocio |
| `acn_success` | 8:00 AM | Éxito estudiantil (onboarding, deserción) | ACN-Negocio |
| `acn_rag` | 8:00 AM | IA con RAG (personalización) | ACN-Negocio |
| `acn_ads` | 9:00 AM | Adquisición de estudiantes (Meta/Google Ads) | ACN-Negocio |
| `acn_content` | Lun 10:00 AM | Contenido educativo y de marca | ACN-Negocio |
| `acn_growth` | 12:00 AM | Analista de crecimiento (CAC/LTV) | ACN-Negocio |
| `acn_ops` | cada 3h | Operaciones y pagos (conciliación, Wompi) | ACN-Negocio |

> Nota: Hermes mantiene más perfiles en `hermes profile list` (default, finanzas_personales, workspace, y los 6 workers del `swarm.yaml` sin perfil propio). No están en uso activo para ACN, así que no se documentan aquí.

---

## 3. Dónde vive cada instrucción (para editarla)

| Capa | Archivo / comando |
|---|---|
| Cron jobs (13) | `hermes cron edit <nombre>` (en el servidor, usuario `soporte`) |
| Perfil (identidad del agente) | `~/.hermes/profiles/<perfil>/SOUL.md` |
| Worker swarm (tmux) | `hermes-workspace/swarm.yaml` (campo `mission`, `role`, `model`) |
| Contrato de coordinación | `AGENTS.md` (sección "Coordinación multi-agente") |
| Modelo por perfil | `~/.hermes/profiles/<perfil>/config.yaml` → `model.default` (global: `~/.hermes/config.yaml`) |

> 2026-08-05: `orchestrator` ya tiene SOUL.md personalizado (ACN). Pendiente de aprobación: aplicar SOUL ACN-específicos al resto de perfiles.

---

## 4. Operar el día a día (3 pasos)

1. **Abre el Workspace:** `http://192.168.1.56:3100`
2. **Dar trabajo:** escribe al **orchestrator** (chat) algo como *"audita web/ y delega"*, o crea una tarjeta en el **TaskBoard**.
3. **Ver resultados:** en **TaskBoard** y **Reports/Inbox**. Las entregas de los agentes de horario quedan en `~/.hermes/cron/output/`.

### Comandos útiles (desde el servidor, usuario `soporte`)
```bash
# Ver agentes cron y su estado
hermes cron list --all

# Activar / pausar un agente
hermes cron resume acn_ads
hermes cron pause acn_ads

# Ver/editar la instrucción de un agente cron
hermes cron edit acn_ads

# Tablero kanban (la cola de trabajo)
hermes kanban --board acn list
hermes kanban --board acn stats

# Crear tarea manual asignada a un perfil
hermes kanban --board acn create "objetivo" --assignee builder

# Swarm (varios especialistas en paralelo + verificación + síntesis)
hermes kanban --board acn swarm "objetivo" \
  --worker builder:Implementa \
  --verifier qa --synthesizer orchestrator

# Ver workers tmux
tmux ls
tmux attach -t swarm-orchestrator    # salir: Ctrl+B, D
```

---

## 5. Solución de problemas (errores conocidos)

| Lo que ves | Qué es | Qué hacer |
|---|---|---|
| `skill not found: social-media` | Skill opcional no instalada | Inofensivo, no bloquea |
| `Ready for Xh with no worker` | Tarea asignada a un perfil que no existe | Reasignar: `hermes kanban --board acn reassign <id> <perfil-real>` |
| Worker swarm sin perfil (km-agent, reviewer, etc.) | Perfil no creado → cae a `default` | Crear el perfil o quitar el worker |
| `Delivery failed ... deliver=telegram` | El aviso a Telegram no resuelve el destino | Revisar gateway de Telegram |
| "Muchos chats" en el Workspace | Son los workers tmux vivos (es normal) | No es desorden |
| `max_concurrent_sessions: 3` | Límite de sesiones en paralelo (a propósito) | No tocar |

---

## 5.5 Telegram (1 bot + grupos)

Un solo bot `@contableiz_bot` sirve todos los reportes. Los grupos son los "canales":
- **ACN-Tecnico** (`-5312435696`): Build-24x7, frontend, backend, qa, docs
- **ACN-Negocio** (`-5569743893`): ads, content, success, growth, ops, ai, rag, finance
- **ACN-Oficina** (`-5474014250`): reservado para resúmenes del orquestador
- El bot NO responde en grupos por defecto (modo privacidad). Para que lea mensajes de grupo: BotFather → `/setprivacy` → **Disable**. Para darle órdenes hoy: **DM** o @mención.
- Token en `~/.hermes/.env` (`TELEGRAM_BOT_TOKEN`). Cambiar deliver: `hermes cron edit <job_id> --deliver telegram:<chat_id>`.
- **Dar órdenes al orquestador:** escribe al bot por **DM** (o @mención en `ACN-Oficina`). El bot actúa como **coordinador**: divide tu orden, delega vía kanban `acn` / swarm y responde con reporte claro (OBJETIVO / QUÉ HICE / RESULTADO / SIGUIENTE PASO). Config: `platforms.telegram.channel_prompts.<chat_id>` en `~/.hermes/config.yaml` (recarga en caliente).
- **Formato de reporte (todos los agentes cron):** cada job responde con `1. RESUMEN · 2. ACCIONES · 3. RESULTADO · 4. SIGUIENTE PASO`, en español y sin logs extensos. Añadido a los 13 prompts.

---

## 6. Estado de referencia (2026-08-05)

- **Workers tmux vivos:** orchestrator, builder, qa, frontend, backend, docs
- **Activos (cron):** ACN-Build-24x7, acn_frontend, acn_backend, acn_qa, acn_docs
- **Pausados (cron):** acn_ads, acn_content, acn_success, acn_growth, acn_ops, acn_ai, acn_rag, acn_finance
- **Board kanban:** `acn` (vinculado al repo ACN, workdir `/home/soporte/proyectos/ACN`)
- **Modelos (todo `:free`, $0):** orchestrator → `nvidia/nemotron-3-ultra-550b-a55b:free` · builder/backend → `poolside/laguna-s-2.1:free` · qa → `openai/gpt-oss-20b:free` · frontend → `poolside/laguna-xs-2.1:free` · docs → `google/gemma-4-26b-a4b-it:free`. Los 6 créditos de OpenRouter quedan como reserva: **no gastar.**
