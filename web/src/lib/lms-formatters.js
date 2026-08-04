// ─────────────────────────────────────────────────────────────
// Utilidades de presentación del LMS: fechas, moneda COP y
// etiquetas de los enums (ES/EN) según el idioma de la app.
// ─────────────────────────────────────────────────────────────

export const formatCOP = (valor) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
    Number(valor) || 0,
  );

export const formatFecha = (iso, lang = 'es') =>
  iso
    ? new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-CO', {
        dateStyle: 'medium',
      }).format(new Date(iso))
    : '—';

export const formatFechaHora = (iso, lang = 'es') =>
  iso
    ? new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-CO', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(iso))
    : '—';

export const formatDiaHora = (iso, lang = 'es') =>
  iso
    ? new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-CO', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(iso))
    : '—';

export const relativeFecha = (iso, lang = 'es') => {
  if (!iso) return '';
  const diff = new Date(iso).getTime() - Date.now();
  const dias = Math.round(diff / 86_400_000);
  const rtf = new Intl.RelativeTimeFormat(lang === 'en' ? 'en' : 'es', { numeric: 'auto' });
  if (Math.abs(dias) >= 30) return rtf.format(Math.round(dias / 30), 'month');
  if (Math.abs(dias) >= 1) return rtf.format(dias, 'day');
  const horas = Math.round(diff / 3_600_000);
  if (Math.abs(horas) >= 1) return rtf.format(horas, 'hour');
  return rtf.format(Math.round(diff / 60_000), 'minute');
};

// ── Etiquetas de enums ───────────────────────────────────────

export const TAREA_TIPO = {
  CONVERSACION: { es: 'Conversación', en: 'Conversation' },
  ESCRITURA: { es: 'Escritura', en: 'Writing' },
  LECTURA: { es: 'Lectura', en: 'Reading' },
  LISTENING: { es: 'Listening', en: 'Listening' },
  VOCABULARIO: { es: 'Vocabulario', en: 'Vocabulary' },
  EXAMEN: { es: 'Examen', en: 'Exam' },
};

export const TAREA_ESTADO = {
  ASSIGNED: { es: 'Asignada', en: 'Assigned' },
  SUBMITTED: { es: 'Entregada', en: 'Submitted' },
  GRADED: { es: 'Calificada', en: 'Graded' },
  EXPIRED: { es: 'Vencida', en: 'Expired' },
};

export const SESION_ESTADO = {
  SCHEDULED: { es: 'Programada', en: 'Scheduled' },
  COMPLETED: { es: 'Completada', en: 'Completed' },
  CANCELLED: { es: 'Cancelada', en: 'Cancelled' },
  RESCHEDULED: { es: 'Reprogramada', en: 'Rescheduled' },
  NO_SHOW: { es: 'No asistió', en: 'No show' },
};

export const PAGO_ESTADO = {
  PENDIENTE: { es: 'Pendiente', en: 'Pending' },
  APROBADO: { es: 'Aprobado', en: 'Approved' },
  RECHAZADO: { es: 'Rechazado', en: 'Rejected' },
  REEMBOLSADO: { es: 'Reembolsado', en: 'Refunded' },
  VENCIDO: { es: 'Vencido', en: 'Overdue' },
};

export const PAGO_METODO = {
  NEQUI: 'Nequi',
  DAVIVIENDA: 'Davivienda',
  WOMPI_CARD: 'Wompi · Tarjeta',
  WOMPI_NEQUI: 'Wompi · Nequi',
  WOMPI_PSE: 'Wompi · PSE',
  EFECTIVO: 'Efectivo',
};

export const LEAD_ESTADO = {
  NUEVO: { es: 'Nuevo', en: 'New' },
  CONTACTADO: { es: 'Contactado', en: 'Contacted' },
  DIAGNOSTICO: { es: 'Diagnóstico', en: 'Diagnosis' },
  OFERTA: { es: 'Oferta', en: 'Offer' },
  CERRADO: { es: 'Cerrado', en: 'Closed' },
  PERDIDO: { es: 'Perdido', en: 'Lost' },
};

export const LEAD_CANAL = {
  WEB: 'Web',
  IG: 'Instagram',
  TIKTOK: 'TikTok',
  FOLLETO: 'Folleto',
  REFERIDO: 'Referido',
};

export const ACTIVIDAD_TIPO = {
  FILL_BLANKS: { es: 'Completar frases', en: 'Fill in the blanks' },
  WORD_SEARCH: { es: 'Sopa de letras', en: 'Word search' },
  QUIZ: { es: 'Quiz', en: 'Quiz' },
  LISTENING: { es: 'Listening', en: 'Listening' },
  GUIDED_CONVERSATION: { es: 'Conversación guiada', en: 'Guided conversation' },
  ROLE_PLAY: { es: 'Rol play', en: 'Role play' },
};

export const MATRICULA_ESTADO = {
  ACTIVE: { es: 'Activa', en: 'Active' },
  PAUSED: { es: 'Pausada', en: 'Paused' },
  FINISHED: { es: 'Finalizada', en: 'Finished' },
  CANCELLED: { es: 'Cancelada', en: 'Cancelled' },
};

export const USER_ESTADO = {
  ACTIVE: { es: 'Activo', en: 'Active' },
  INACTIVE: { es: 'Inactivo', en: 'Inactive' },
  SUSPENDED: { es: 'Suspendido', en: 'Suspended' },
};

export const ROL = {
  STUDENT: { es: 'Estudiante', en: 'Student' },
  TEACHER: { es: 'Profesor(a)', en: 'Teacher' },
  ADMIN: { es: 'Administrador(a)', en: 'Administrator' },
};

export const NIVELES_MCER = ['A1', 'A2', 'B1', 'B2', 'C1'];

export const MODULO_TIPO = {
  GRAMMAR: { es: 'Gramática', en: 'Grammar' },
  VOCABULARY: { es: 'Vocabulario', en: 'Vocabulary' },
  SPEAKING: { es: 'Speaking', en: 'Speaking' },
  LISTENING: { es: 'Listening', en: 'Listening' },
  READING: { es: 'Reading', en: 'Reading' },
  WRITING: { es: 'Writing', en: 'Writing' },
};

export const CURSO_ESTADO = {
  DRAFT: { es: 'Borrador', en: 'Draft' },
  PUBLISHED: { es: 'Publicado', en: 'Published' },
  ARCHIVED: { es: 'Archivado', en: 'Archived' },
};

export const PAQUETE_ESTADO = {
  ACTIVO: { es: 'Activo', en: 'Active' },
  INACTIVO: { es: 'Inactivo', en: 'Inactive' },
};

export const etiqueta = (map, key, lang = 'es') => {
  const e = map?.[key];
  if (!e) return key ?? '—';
  return typeof e === 'string' ? e : e[lang] ?? e.es;
};

export const nivelColor = (nivel) => {
  const idx = ['A1', 'A2', 'B1', 'B2', 'C1'].indexOf(nivel);
  if (idx <= 1) return 'bg-green-100 text-green-700';
  if (idx === 2) return 'bg-amber-100 text-amber-700';
  return 'bg-[#3C3B6E]/10 text-[#3C3B6E]';
};
