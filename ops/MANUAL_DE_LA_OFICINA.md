# MANUAL DE LA OFICINA — ACN Institute

> Guía práctica para operar la "oficina" de agentes autónomos de ACN.
> Servidor: 192.168.110.38 (IP dinámica/rebota) | Workspace: http://192.168.110.38:3100 | Repo: /home/soporte/proyectos/ACN

---

## 1. Modelo mental (2 reglas)

1. **Los agentes son "empleados"** con instrucciones fijas. No se programan con código: se les edita su *instrucción* (SOUL / prompt / misión).
2. **Solo hay 2 formas de que trabajen:**

| Forma | Qué es | Quién la usa |
|---|---|---|
| **Por horario (cron)** | Los agentes trabajan solos a su hora, sin que tú hagas nada. | 12 jobs "acn_*" + ACN-Build-24x7 |
| **Bajo demanda (kanban/swarm)** | Le das un objetivo y el **orquestador** divide, delega a los especialistas, y el **dispatcher** los ejecuta. | Perfiles del board `acn` + dispatcher kanban |

---

## 2. Agentes en trabajo activo

### 2.1 Especialistas bajo demanda (kanban dispatch)

> Ya no se usan sesiones `tmux` (se eliminaron tras el reboot 2026-08-05). Los especialistas se ejecutan bajo demanda cuando el **dispatcher kanban** lanza la tarjeta del board `acn` con el perfil correspondiente.

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
| Swarm (misión/tareas) | Board `acn` + `hermes kanban swarm`/`dispatch` (perfiles en `~/.hermes/profiles/`) |
| Contrato de coordinación | `AGENTS.md` (sección "Coordinación multi-agente") |
| Modelo por perfil | `~/.hermes/profiles/<perfil>/config.yaml` → `model.default` (global: `~/.hermes/config.yaml`) |

### SOULs (identidad por rol) — configurado 2026-08-05

| Perfil | SOUL (instrucción) | Skill de rol |
|---|---|---|
| `orchestrator` | **Agente Director** (`<identity>/<context>/<agent_pool>/<custom_commands>`): /reporte /estado /plan-dia /nuevo-lead; delega vía kanban `acn` | `acn-oficina` |
| `builder` | Implementador: features/bugfixes con evidencia (build/lint/typecheck/tests) | `acn-stack` + `acn-oficina` |
| `qa` | Verificador: cobertura ≥80%, pirámide 70/20/10, smoke | `acn-qa` + `acn-oficina` |
| `frontend` | Frontend/UX/rendimiento: Web Vitals LCP<2.5s, CLS<0.1, builds | `acn-stack` + `acn-oficina` |
| `backend` | Backend/API/seguridad: OWASP L2, rate limit, Wompi | `acn-stack` + `acn-oficina` |
| `docs` | Documentación: ARQUITECTURA/ESTADO/marca; .docx vía pandoc | `acn-docs` + `acn-oficina` |
| `ops-watch` | Vigilancia de infra: gateway, cron, workers | `acn-ops-watch` + `acn-oficina` |
| `acquisition` | Ventas: leads, ads, WhatsApp, LEADS.md | `acn-negocio` + `acn-oficina` |
| `content` | Contenido y marca | `acn-negocio` + `acn-oficina` |
| `success` | Éxito estudiantil: onboarding, retención, NPS día 7 | `acn-negocio` + `acn-oficina` |
| `datafinance` | Finanzas: flujo de caja, Sheets ↔ LMS | `acn-negocio` + `acn-oficina` |
| `ai` | IA: ElevenLabs (Bella), RAG all-MiniLM | `acn-negocio` + `acn-oficina` |
| `payments` | Pagos: Wompi/Nequi/Davivienda, PENDIENTE >24h | `acn-negocio` + `acn-oficina` |
| `growth` | Crecimiento: CAC<15k, LTV>3x | `acn-negocio` + `acn-oficina` |
| `devops` | Infra y despliegue | `acn-negocio` + `acn-oficina` |

- **Skills:** ubicadas en `~/.hermes/profiles/<perfil>/skills/<skill>/SKILL.md`. `acn-oficina` (global) está copiada en todos los perfiles. Verificar: `HERMES_HOME=~/.hermes/profiles/<perfil> hermes skills list`.
- **Backups:** `SOUL.md.bak.roles` por perfil (versión genérica anterior).
- **Tools/abilities:** el contrato de herramientas por worker está en `swarm.yaml` (campos `tools`, `modes`, `capabilities`); las habilidades procedimentales vienen de las skills.

### 3.1 Especialización por perfil (2026-08-05)

Cada perfil pasó de **74 skills** a solo las de su rol, vía `skills.disabled` y `disabled_toolsets` en su `config.yaml`:

| Perfil | Skills habilitadas (~) | Toolsets activos | Toolsets deshabilitados |
|---|---|---|---|
| `orchestrator` | 8 | terminal, file, web, skills, todo, memory, session_search, clarify, delegation, cronjob | bfl, browser, code_execution, computer_use, context_engine, homeassistant, image_gen, spotify, stt, tts, video, video_gen, vision, x_search, yuanbao |
| `builder` / `backend` | 17 | terminal, file, web, browser, code_execution, skills, todo, memory, clarify | image_gen, tts, stt, computer_use, delegation, cronjob, vision, bfl, video... |
| `frontend` | 16 | terminal, file, web, browser, code_execution, skills, todo, memory, clarify | idem dev |
| `qa` | 9 | terminal, file, web, browser, code_execution, skills, todo, memory, clarify | — |
| `docs` | 13 | terminal, file, web, skills, todo, memory, clarify | — |
| `ops-watch` | 6 | terminal, file, web, skills, todo, memory, session_search, cronjob, clarify | — |
| `content` / `acquisition` / `success` / `growth` | 8–11 | web, file, skills, todo, memory, clarify | — |
| `ai` | 11 | terminal, file, web, skills, todo, memory, clarify | — |
| `datafinance` / `payments` | 7 | web, file (+ terminal en payments), skills, todo, memory, clarify | — |

- **Efecto:** cada agente solo "sabe" su especialidad. `content` no programa, `builder` no hace marketing, `ops-watch` solo vigila.
- **Reaplicar:** editar `skills.disabled` / `disabled_toolsets` en el config del perfil (backups `config.yaml.bak.skills`).

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

# Ejecutar la cola de trabajos (dispatcher: reclama, promueve, spawn a los agentes)
hermes kanban --board acn dispatch

# Ver estado de los agentes/workers vivos
systemctl status hermes-gateway
```

---

## 5. Solución de problemas (errores conocidos)

| Lo que ves | Qué es | Qué hacer |
|---|---|---|
| `skill not found: social-media` | Skill opcional no instalada | Inofensivo, no bloquea |
| `Ready for Xh with no worker` | Tarea asignada a un perfil que no existe | Reasignar: `hermes kanban --board acn reassign <id> <perfil-real>` |
| Worker swarm sin perfil (km-agent, reviewer, etc.) | Perfil no creado → cae a `default` | Crear el perfil o quitar el worker |
| `Delivery failed ... deliver=telegram` | El aviso a Telegram no resuelve el destino | Revisar gateway de Telegram |
| "Muchos chats" en el Workspace | Sesiones activas de agentes/Telegram (normal) | No es desorden |
| `max_concurrent_sessions: 3` | Límite de sesiones en paralelo (a propósito) | No tocar |

---

## 5.5 Telegram (1 bot + enrutamiento por grupo → agente)

Un solo bot `@contableiz_bot` sirve todos los canales, pero **cada grupo es atendido por su propio agente** (perfil distinto: SOUL, skills y tools propios). Se usa `gateway.multiplex_profiles: true` + `gateway.profile_routes` en `~/.hermes/config.yaml`.

| Grupo / canal | chat_id | Agente que responde | Rol |
|---|---|---|---|
| **ACN-Oficina** | `-5474014250` | `orchestrator` | Agente Director: coordina, delega al swarm, reporta |
| **ACN-Tecnico** | `-5312435696` | `builder` | Tech Lead: frontend/backend/qa/devops, reportes técnicos |
| **ACN-Negocio** | `-5569743893` | `content` | Lead de Negocio: marketing, ventas, adquisición |
| **DM del coordinador** | `816320302` | `orchestrator` | Control privado: ordenas y él reparte |

- **Tú solo hablas con los "líderes" de grupo** (o al orquestador por DM). No asignas tareas individuales a frontend/backend/etc.: el orquestador las reparte vía kanban `acn` / swarm.
- **Canal base por agente** (`platforms.telegram.home_channel` en el config de cada perfil): sus crones y notificaciones se entregan a su grupo.
- Token en `~/.hermes/.env` (`TELEGRAM_BOT_TOKEN`). Cambiar deliver de un job: `hermes cron edit <job_id> --deliver telegram:<chat_id>`.
- **Perfiles secundarios sin plataformas propias**: para que el multiplex no intente conectar bots duplicados, en el `config.yaml` de cada perfil ACN están `platforms.telegram.whatsapp.etc.enabled: false` (+ `api_server.enabled: false`) y en su `.env` `TELEGRAM_ENABLED=false`/`WHATSAPP_ENABLED=false`. Solo el perfil `default` posee el bot.
- **Formato de reporte (todos los agentes):** `1. RESUMEN · 2. ACCIONES · 3. RESULTADO · 4. SIGUIENTE PASO`, en español y sin logs extensos.
- **Reiniciar gateway tras tocar rutas:** `sudo systemctl restart hermes-gateway`.

---

## 6. Estado de referencia (2026-08-05)

- **Arquitectura:** 1 bot `@contableiz_bot` + `multiplex_profiles` + `profile_routes`. ACN-Oficina→orchestrator, ACN-Tecnico→builder, ACN-Negocio→content, DM→orchestrator. Verificado: cada grupo responde con su agente (2026-08-05).
- **Especialización:** los 15 perfiles ACN con `skills.disabled` + `disabled_toolsets` (8–23 skills cada uno); perfiles secundarios sin plataformas propias.
- **Cron:** `ops-watch-health` (cada 5 min) anclado a `nvidia/nemotron-3-nano-30b-a3b:free`.
- **Activos (cron):** ACN-Build-24x7, acn_frontend, acn_backend, acn_qa, acn_docs, ops-watch-health
- **Pausados (cron):** acn_ads, acn_content, acn_success, acn_growth, acn_ops, acn_ai, acn_rag, acn_finance
- **Board kanban:** `acn` (vinculado al repo ACN, workdir `/home/soporte/proyectos/ACN`)
- **Modelos (todo `:free`, $0):** orchestrator → `nvidia/nemotron-3-ultra-550b-a55b:free` · builder/backend → `poolside/laguna-s-2.1:free` · qa → `openai/gpt-oss-20b:free` · frontend → `poolside/laguna-xs-2.1:free` · docs → `google/gemma-4-26b-a4b-it:free` · ops-watch → `nvidia/nemotron-3-nano-30b-a3b:free`. Los 6 créditos de OpenRouter quedan como reserva: **no gastar.**
