// ─────────────────────────────────────────────────────────────
// lmsClient — cliente HTTP del LMS (F2.A2)
// Reemplaza el acceso directo a base44Client (localStorage) para
// todos los datos del LMS. Conecta el login real a
// POST /api/auth/login del servidor Express (web/server).
// - Respuestas consistentes: { data: ... } | { error: { code, message, details } }
// - Token JWT en localStorage (clave 'acn_lms_token')
// - Manejo de errores normalizado (ApiError con status y code)
// ─────────────────────────────────────────────────────────────

const TOKEN_KEY = 'acn_lms_token';
const API_BASE = '/api';

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* noop */
  }
};

export const clearToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* noop */
  }
};

async function request(path, { method = 'GET', body, headers = {}, auth = true, timeout = 30000 } = {}) {
  const token = getToken();
  const finalHeaders = { ...headers };
  if (auth && token) finalHeaders.Authorization = `Bearer ${token}`;

  let payload;
  if (body instanceof FormData) {
    payload = body; // el navegador fija el Content-Type multipart con boundary
  } else if (body !== undefined) {
    finalHeaders['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: finalHeaders,
      body: payload,
      signal: controller.signal,
    });

    let json = null;
    const text = await res.text();
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
    }

    if (!res.ok) {
      const err = json?.error ?? {
        code: 'HTTP_ERROR',
        message: `Error del servidor (${res.status})`,
      };
      // Token inválido/expirado: limpiar sesión local
      if (res.status === 401) clearToken();
      throw new ApiError(res.status, err.code, err.message, err.details);
    }
    return json?.data !== undefined ? json.data : json;
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new ApiError(408, 'TIMEOUT', 'La solicitud tardó demasiado. Intenta de nuevo.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

const qs = (params = {}) => {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  );
  const s = new URLSearchParams(clean).toString();
  return s ? `?${s}` : '';
};

// ── Endpoints agrupados por módulo del contrato (docs/ARQUITECTURA.md) ──

export const authApi = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  me: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),
  resetPassword: (passwordActual, nuevaPassword) =>
    request('/auth/reset-password', { method: 'POST', body: { passwordActual, nuevaPassword } }),
  register: (data) => request('/auth/register', { method: 'POST', body: data, auth: false }),
};

export const usersApi = {
  list: (params = {}) => request(`/users${qs(params)}`),
  create: (data) => request('/users', { method: 'POST', body: data }),
  update: (id, data) => request(`/users/${id}`, { method: 'PATCH', body: data }),
  remove: (id) => request(`/users/${id}`, { method: 'DELETE' }),
};

export const profilesApi = {
  get: (studentId) => request(`/students/${studentId}/profile`),
  put: (studentId, data) => request(`/students/${studentId}/profile`, { method: 'PUT', body: data }),
  levelTest: (studentId, nivel, respuestasJson) =>
    request(`/students/${studentId}/level-test`, { method: 'POST', body: { nivel, respuestasJson } }),
};

export const coursesApi = {
  list: (params = {}) => request(`/courses${qs(params)}`),
  get: (id) => request(`/courses/${id}`),
  create: (data) => request('/courses', { method: 'POST', body: data }),
  update: (id, data) => request(`/courses/${id}`, { method: 'PATCH', body: data }),
  modules: (id) => request(`/courses/${id}/modules`),
  createModule: (id, data) => request(`/courses/${id}/modules`, { method: 'POST', body: data }),
};

export const enrollmentsApi = {
  list: (params = {}) => request(`/enrollments${qs(params)}`),
  create: (data) => request('/enrollments', { method: 'POST', body: data }),
  update: (id, data) => request(`/enrollments/${id}`, { method: 'PATCH', body: data }),
};

export const sessionsApi = {
  list: (params = {}) => request(`/sessions${qs(params)}`),
  get: (id) => request(`/sessions/${id}`),
  create: (data) => request('/sessions', { method: 'POST', body: data }),
  update: (id, data) => request(`/sessions/${id}`, { method: 'PATCH', body: data }),
  cancel: (id) => request(`/sessions/${id}/cancel`, { method: 'POST' }),
};

export const tasksApi = {
  list: (params = {}) => request(`/tasks${qs(params)}`),
  get: (id) => request(`/tasks/${id}`),
  create: (data) => request('/tasks', { method: 'POST', body: data }),
  update: (id, data) => request(`/tasks/${id}`, { method: 'PATCH', body: data }),
  submit: (id, data) => request(`/tasks/${id}/submissions`, { method: 'POST', body: data }),
  grade: (id, data) => request(`/tasks/${id}/grades`, { method: 'POST', body: data }),
};

export const packagesApi = {
  list: () => request('/packages'),
  update: (id, data) => request(`/packages/${id}`, { method: 'PATCH', body: data }),
};

export const paymentsApi = {
  list: (params = {}) => request(`/payments${qs(params)}`),
  create: (data) => request('/payments', { method: 'POST', body: data }),
  update: (id, data) => request(`/payments/${id}`, { method: 'PATCH', body: data }),
};

export const activitiesApi = {
  list: (params = {}) => request(`/activities${qs(params)}`),
  create: (data) => request('/activities', { method: 'POST', body: data }),
  attempts: (id) => request(`/activities/${id}/attempts`),
  submitAttempt: (id, data) => request(`/activities/${id}/attempts`, { method: 'POST', body: data }),
};

export const resourcesApi = {
  list: (params = {}) => request(`/resources${qs(params)}`),
  create: (data) => request('/resources', { method: 'POST', body: data }),
  remove: (id) => request(`/resources/${id}`, { method: 'DELETE' }),
};

export const messagesApi = {
  conversations: () => request('/messages/conversations'),
  list: (withUserId) => request(`/messages?with=${withUserId}`),
  send: (destinatarioId, contenido, tipo = 'MENSAJE') =>
    request('/messages', { method: 'POST', body: { destinatarioId, contenido, tipo } }),
  markRead: (id) => request(`/messages/${id}/read`, { method: 'POST' }),
};

export const leadsApi = {
  list: (params = {}) => request(`/leads${qs(params)}`),
  create: (data) => request('/leads', { method: 'POST', body: data }),
  update: (id, data) => request(`/leads/${id}`, { method: 'PATCH', body: data }),
};

export const reportsApi = {
  income: (params = {}) => request(`/reports/income${qs(params)}`),
  attendance: () => request('/reports/attendance'),
  progress: () => request('/reports/progress'),
};

export const integrationsApi = {
  status: () => request('/integrations/status'),
};

export const dashboardApi = {
  me: () => request('/dashboard'),
};

export const notificationsApi = {
  get: () => request('/notifications'),
  readAll: () => request('/notifications/read-all', { method: 'POST' }),
};

// Subida de archivos (multipart) — devuelve { url, nombre, tipo, tamanoBytes }
export const uploadFile = (file) => {
  const form = new FormData();
  form.append('file', file);
  return request('/upload', { method: 'POST', body: form, timeout: 60000 });
};

// Descarga de CSV con auth (fetch manual para leer el blob)
export const downloadCsv = async (path, filename) => {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new ApiError(res.status, 'CSV_ERROR', 'No se pudo descargar el reporte');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export const lms = {
  auth: authApi,
  users: usersApi,
  profiles: profilesApi,
  courses: coursesApi,
  enrollments: enrollmentsApi,
  sessions: sessionsApi,
  tasks: tasksApi,
  packages: packagesApi,
  payments: paymentsApi,
  activities: activitiesApi,
  resources: resourcesApi,
  messages: messagesApi,
  leads: leadsApi,
  reports: reportsApi,
  integrations: integrationsApi,
  dashboard: dashboardApi,
  notifications: notificationsApi,
  uploadFile,
  downloadCsv,
  getToken,
  clearToken,
};

export default lms;
