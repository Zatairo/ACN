const LS = {
  users: 'uslearn_users',
  profiles: 'uslearn_profiles',
  lessons: 'uslearn_lessons',
  token: 'uslearn_token',
  otp: 'uslearn_otp',
  reset: 'uslearn_reset_tokens',
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const uid = () => `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('ACN Institute storage error:', error);
  }
};

const hash = (str) => {
  let h = 0;
  const s = String(str || '');
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return `h${Math.abs(h).toString(36)}`;
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const getToken = () => {
  try {
    return localStorage.getItem(LS.token);
  } catch {
    return null;
  }
};

const currentUser = () => {
  const token = getToken();
  if (!token) return null;
  return read(LS.users, []).find((u) => u.id === token) || null;
};

const requireUser = () => {
  const user = currentUser();
  if (!user) {
    const err = new Error('Authentication required');
    err.status = 401;
    throw err;
  }
  return user;
};

const roleOf = (user) => {
  if (!user) return null;
  if (user.role === 'admin') return 'admin';
  const users = read(LS.users, []);
  if (!users.some((u) => u.role === 'admin')) {
    const first = [...users].sort((a, b) => String(a.created_date).localeCompare(String(b.created_date)))[0];
    if (first && first.id === user.id) return 'admin';
  }
  return user.role || 'user';
};

const isAdmin = (user) => roleOf(user) === 'admin';

const requireAdmin = () => {
  const user = requireUser();
  if (!isAdmin(user)) {
    const err = new Error('Admin access required');
    err.status = 403;
    throw err;
  }
  return user;
};

const publicUser = (u) => {
  const { password, ...rest } = u;
  return rest;
};

const sendOtp = (email) => {
  if (!email) return;
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const otp = read(LS.otp, {});
  otp[email] = code;
  write(LS.otp, otp);
  console.warn(`[ACN Institute demo] Código de verificación para ${email}: ${code}`);
  window.alert(`[ACN Institute demo]\n\nTu código de verificación es:\n\n${code}`);
};

const auth = {
  async isAuthenticated() {
    return !!currentUser();
  },

  async me() {
    const user = requireUser();
    return { ...user, role: roleOf(user) };
  },

  async register({ email, password }) {
    const e = normalizeEmail(email);
    if (!e || !password) {
      const err = new Error('Email and password are required');
      err.status = 400;
      throw err;
    }
    const users = read(LS.users, []);
    if (users.some((u) => u.email === e)) {
      const err = new Error('An account with this email already exists');
      err.status = 409;
      throw err;
    }
    users.push({
      id: uid(),
      email: e,
      password: hash(password),
      name: '',
      role: users.length === 0 ? 'admin' : 'user',
      provider: 'email',
      verified: false,
      enabled: true,
      created_date: new Date().toISOString(),
    });
    write(LS.users, users);
    sendOtp(e);
  },

  async verifyOtp({ email, otpCode }) {
    const e = normalizeEmail(email);
    const otp = read(LS.otp, {});
    if (!otp[e] || String(otpCode) !== String(otp[e])) {
      const err = new Error('Invalid verification code');
      err.status = 400;
      throw err;
    }
    delete otp[e];
    write(LS.otp, otp);
    const users = read(LS.users, []);
    const user = users.find((u) => u.email === e);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
    user.verified = true;
    write(LS.users, users);
    return { access_token: user.id };
  },

  async resendOtp(email) {
    sendOtp(normalizeEmail(email));
  },

  async loginViaEmailPassword(email, password) {
    const e = normalizeEmail(email);
    const user = read(LS.users, []).find((u) => u.email === e && u.password === hash(password));
    if (!user) {
      const err = new Error('Invalid email or password');
      err.status = 401;
      throw err;
    }
    if (user.enabled === false) {
      const err = new Error('This account has been disabled by the administrator');
      err.status = 403;
      throw err;
    }
    localStorage.setItem(LS.token, user.id);
  },

  async loginWithProvider(provider, redirectTo) {
    const demoEmail = `demo.${provider || 'google'}@acn-institute.app`;
    const users = read(LS.users, []);
    let user = users.find((u) => u.email === demoEmail);
    if (!user) {
      user = {
        id: uid(),
        email: demoEmail,
        password: '',
        name: 'Google User',
        role: users.length === 0 ? 'admin' : 'user',
        provider: provider || 'google',
        verified: true,
        enabled: true,
        created_date: new Date().toISOString(),
      };
      users.push(user);
      write(LS.users, users);
    }
    if (user.enabled === false) {
      const err = new Error('This account has been disabled by the administrator');
      err.status = 403;
      throw err;
    }
    localStorage.setItem(LS.token, user.id);
    window.location.href = redirectTo || '/';
  },

  async logout() {
    localStorage.removeItem(LS.token);
  },

  redirectToLogin(redirectTo) {
    window.location.href = `/login${redirectTo ? `?from=${encodeURIComponent(redirectTo)}` : ''}`;
  },

  setToken(token) {
    localStorage.setItem(LS.token, token);
  },

  async resetPasswordRequest(email) {
    const e = normalizeEmail(email);
    const users = read(LS.users, []);
    if (!users.some((u) => u.email === e)) return;
    const token = uid();
    const resets = read(LS.reset, {});
    resets[e] = token;
    write(LS.reset, resets);
    console.warn(`[ACN Institute demo] Token de restablecimiento para ${e}: ${token}`);
    window.alert(`[ACN Institute demo]\n\nTu token de restablecimiento es:\n\n${token}`);
  },

  async resetPassword({ resetToken, newPassword }) {
    const resets = read(LS.reset, {});
    const email = Object.keys(resets).find((k) => resets[k] === resetToken);
    if (!email || !newPassword) {
      const err = new Error('Invalid or expired reset link');
      err.status = 400;
      throw err;
    }
    const users = read(LS.users, []);
    const user = users.find((u) => u.email === email);
    if (user) {
      user.password = hash(newPassword);
      write(LS.users, users);
    }
    delete resets[email];
    write(LS.reset, resets);
  },

  async listUsers() {
    requireAdmin();
    return read(LS.users, []).map(publicUser);
  },

  async createUser({ email, password, name = '', role = 'user' }) {
    requireAdmin();
    const e = normalizeEmail(email);
    if (!e || !password) {
      const err = new Error('Email and password are required');
      err.status = 400;
      throw err;
    }
    const users = read(LS.users, []);
    if (users.some((u) => u.email === e)) {
      const err = new Error('An account with this email already exists');
      err.status = 409;
      throw err;
    }
    const user = {
      id: uid(),
      email: e,
      password: hash(password),
      name,
      role: role === 'admin' ? 'admin' : 'user',
      provider: 'email',
      verified: true,
      enabled: true,
      created_date: new Date().toISOString(),
    };
    users.push(user);
    write(LS.users, users);
    return publicUser(user);
  },

  async updateUser(id, patch) {
    requireAdmin();
    const users = read(LS.users, []);
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
    const allowed = ['name', 'role', 'enabled'];
    const clean = {};
    for (const key of allowed) {
      if (patch[key] !== undefined) clean[key] = patch[key];
    }
    users[idx] = { ...users[idx], ...clean };
    write(LS.users, users);
    return publicUser(users[idx]);
  },
};

const makeEntity = (storeKey) => {
  const list = () => read(storeKey, []);
  return {
    async filter(filters = {}, order = '', limit = 0) {
      const user = requireUser();
      const admin = isAdmin(user);
      const items = list().filter((item) => {
        if (!admin && item.created_by_id !== user.id) return false;
        return Object.entries(filters).every(([key, value]) => item[key] === value);
      });
      if (order === '-created_date') items.sort((a, b) => String(b.created_date).localeCompare(String(a.created_date)));
      else if (order === 'created_date') items.sort((a, b) => String(a.created_date).localeCompare(String(b.created_date)));
      return limit > 0 ? items.slice(0, limit) : items;
    },

    async get(id) {
      const user = requireUser();
      const item = list().find((x) => x.id === id && (isAdmin(user) || x.created_by_id === user.id));
      if (!item) {
        const err = new Error('Not found');
        err.status = 404;
        throw err;
      }
      return item;
    },

    async create(data) {
      const user = requireUser();
      const item = { ...data, id: uid(), created_by_id: user.id, created_date: new Date().toISOString() };
      const items = list();
      items.push(item);
      write(storeKey, items);
      return item;
    },

    async update(id, patch) {
      const user = requireUser();
      const items = list();
      const idx = items.findIndex((x) => x.id === id && (isAdmin(user) || x.created_by_id === user.id));
      if (idx === -1) {
        const err = new Error('Not found');
        err.status = 404;
        throw err;
      }
      items[idx] = { ...items[idx], ...patch };
      write(storeKey, items);
      return items[idx];
    },

    async delete(id) {
      const user = requireUser();
      write(storeKey, list().filter((x) => !(x.id === id && (isAdmin(user) || x.created_by_id === user.id))));
    },
  };
};

const entities = {
  Lesson: makeEntity(LS.lessons),
  StudentProfile: makeEntity(LS.profiles),
};

const VOCAB = {
  A1: ['family', 'house', 'work', 'friend', 'water', 'school', 'morning', 'night', 'city', 'food', 'book', 'time', 'home', 'money', 'day'],
  A2: ['engineer', 'office', 'computer', 'company', 'breakfast', 'children', 'notebook', 'building', 'design', 'project', 'meeting', 'report', 'manager', 'language', 'english'],
  B1: ['opportunity', 'bilingual', 'schedule', 'deadline', 'customer', 'improve', 'confident', 'practice', 'career', 'position', 'contract', 'interview', 'training', 'feedback', 'achieve'],
  B2: ['negotiation', 'leadership', 'efficiency', 'innovation', 'workplace', 'collaborate', 'strategic', 'professional', 'presentation', 'productivity', 'responsibility', 'communication', 'development', 'performance', 'initiative'],
  C1: ['procurement', 'stakeholder', 'benchmark', 'revenue', 'turnover', 'feasibility', 'implement', 'streamline', 'quarterly', 'proficient', 'fluent', 'articulate', 'subordinate', 'redundancy', 'milestone'],
};

const levelFromPrompt = (prompt) => {
  const match = String(prompt || '').match(/\b(A1|A2|B1|B2|C1)\b/);
  return match ? match[1] : 'A2';
};

const svgPlaceholder = (seed, label) => {
  const colors = ['3C3B6E', 'B22234', '2e2d5a'];
  const color = colors[Math.abs(seed) % colors.length];
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450">` +
    `<rect width="800" height="450" fill="#${color}"/>` +
    `<text x="400" y="225" font-family="Arial, sans-serif" font-size="36" fill="white" text-anchor="middle" dominant-baseline="middle">${label || 'ACN Institute'}</text>` +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const seedFrom = (str) => String(str || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

const GAP_TEMPLATES = [
  (w) => `I wrote the word "${w}" in my notebook before the meeting.`,
  (w) => `My colleague talks about ${w} every day at the office.`,
  (w) => `Learning ${w} in English helps me at my job.`,
  (w) => `The teacher asked us to practice ${w} at home.`,
  (w) => `I need to use ${w} when I write my report.`,
  (w) => `In the morning I read about ${w} on my computer.`,
  (w) => `Can you explain the word ${w} in simple English?`,
];

const PASSAGES = [
  {
    text: 'The student reads English every night before sleeping. She says this routine helps her remember new words better and feel more confident in conversations.',
    options: ['She reads to fall asleep faster.', 'She reads to remember new words.', 'She reads only for work.'],
    answer: 'She reads to remember new words.',
  },
  {
    text: 'At the office, the team works with international clients. Speaking English well has opened new projects and helped everyone grow professionally.',
    options: ['English is not useful at the office.', 'English helped the team grow professionally.', 'The team works alone.'],
    answer: 'English helped the team grow professionally.',
  },
  {
    text: 'Every Saturday morning, the student practices English with a conversation partner. They talk about food, travel and family for about an hour.',
    options: ['They practice every Saturday morning.', 'They practice every month.', 'They never practice together.'],
    answer: 'They practice every Saturday morning.',
  },
  {
    text: 'The student wants to become bilingual to apply for better jobs. His plan is to study two hours a day and take the CEFR exam next year.',
    options: ['He wants to stop studying.', 'He plans to take the CEFR exam next year.', 'He prefers to learn French.'],
    answer: 'He plans to take the CEFR exam next year.',
  },
];

const SCRAMBLES = [
  { words: ['Please', 'review', 'the', 'report', 'before', 'tomorrow'], context: 'Email a un colega sobre un reporte' },
  { words: ['I', 'would', 'like', 'to', 'schedule', 'a', 'meeting'], context: 'Organizando una reunión' },
  { words: ['Thank', 'you', 'for', 'your', 'quick', 'reply'], context: 'Agradeciendo una respuesta' },
  { words: ['Could', 'you', 'send', 'me', 'the', 'file'], context: 'Solicitando un archivo' },
  { words: ['The', 'project', 'is', 'on', 'schedule'], context: 'Actualizando el estado del proyecto' },
];

const extractProfile = (prompt) => {
  const get = (label) => {
    const match = String(prompt).match(new RegExp(`- ${label}:\\s*([^\\n]+)`));
    return match ? match[1].trim() : '';
  };
  return {
    name: get('Name'),
    profession: get('Profession'),
    location: get('Location'),
    family: get('Family'),
    motivation: get('Motivation'),
    level: levelFromPrompt(prompt),
  };
};

const hintFor = (word) => `${word[0]}${'_'.repeat(word.length - 1)} (${word.length} letters)`;

const buildGapExercises = (level) => {
  const vocab = VOCAB[level] || VOCAB.A2;
  return GAP_TEMPLATES.slice(0, 7).map((template, i) => {
    const answer = vocab[i % vocab.length];
    return { sentence: template(answer).replace(answer, '___'), answer, hint: hintFor(answer) };
  });
};

const buildWordList = (level) => [...(VOCAB[level] || VOCAB.A2)];

const buildLesson = (profile) => {
  const name = profile.name || 'the student';
  const profession = profile.profession || 'professional';
  const location = profile.location || 'his city';
  const level = profile.level || 'A2';
  const vocab = VOCAB[level] || VOCAB.A2;
  const motivation = profile.motivation || 'grow professionally';

  const readingText =
    `${name} is a ${profession} who lives in ${location}. Every morning, ${name} wakes up early and has a healthy breakfast before going to work. ` +
    `${name} works on interesting projects with a friendly team of colleagues. At the office, ${name} uses a computer, writes reports and attends meetings in English. ` +
    `${name} studies English every evening because ${motivation.toLowerCase()}. In free time, ${name} practices new vocabulary and listens to English podcasts. ` +
    `This routine helps ${name} become more confident and bilingual step by step.`;

  const listeningScript =
    `${name} starts the day with a healthy breakfast. [pause] Then ${name} goes to work as a ${profession}. [pause] After work, ${name} studies English and practices new vocabulary with flashcards. [pause] The dream is to become a confident bilingual professional and travel to the United States.`;

  const story =
    `On a sunny Monday morning, ${name} arrives at the office in ${location} with a big cup of coffee. The team is preparing for an important meeting with an international client. ` +
    `${name} reviews the project one more time and practices the presentation in English. After a successful meeting, the client congratulates everyone. ${name} smiles: years of practice are paying off.`;

  const comprehensionQuestion = '¿Qué hace el estudiante cada mañana antes de trabajar?';
  const comprehensionOptions = [
    'Se despierta temprano y desayuna saludable',
    'Trabaja hasta la medianoche',
    'Duerme hasta el mediodía',
  ];

  const hangmanWords = vocab.filter((w) => w.length >= 5 && w.length <= 12).slice(0, 5).map((w) => w.toUpperCase());

  return {
    title: `A day in the life of a ${profession}`,
    reading_text: readingText,
    listening_script: listeningScript,
    writing_prompt: `Write a short email to your boss describing one project you finished this month. Use at least 5 words from the lesson vocabulary.`,
    speaking_instructions: `Practice reading the reading text out loud. Pay attention to the sound of "th" and the final "s". Record yourself and compare with the audio.`,
    key_vocabulary: vocab,
    audio_accent: 'us',
    activities: [
      {
        type: 'visual_storytelling',
        title: 'Historia visual',
        instructions: 'Lee la historia sobre el estudiante y responde la pregunta.',
        data: {
          story,
          image_prompts: [
            `${name} arriving at the office with coffee on a sunny morning`,
            `the team preparing a presentation for an international client`,
            `${name} celebrating a successful meeting with colleagues`,
          ],
          image_urls: [
            svgPlaceholder(1, 'Scene 1'),
            svgPlaceholder(2, 'Scene 2'),
            svgPlaceholder(3, 'Scene 3'),
          ],
          comprehension_question: comprehensionQuestion,
          options: comprehensionOptions,
          answer: comprehensionOptions[0],
        },
      },
      {
        type: 'hangman',
        title: 'Ahorcado',
        instructions: 'Adivina las palabras de tu vocabulario antes de agotar los intentos.',
        data: { theme: `Vocabulario de ${profession}`, words: hangmanWords },
      },
      {
        type: 'word_search',
        title: 'Sopa de letras',
        instructions: 'Encuentra las 15 palabras de la lección en la cuadrícula.',
        data: { words: vocab },
      },
      {
        type: 'fill_gaps',
        title: 'Completa las frases',
        instructions: 'Escribe la palabra correcta en cada espacio en blanco.',
        data: { exercises: buildGapExercises(level) },
      },
      {
        type: 'reading_completing',
        title: 'Comprensión lectora',
        instructions: 'Lee cada pasaje y elige la conclusión correcta.',
        data: { passages: PASSAGES },
      },
      {
        type: 'vocabulary_context',
        title: 'Vocabulario en contexto',
        instructions: 'Relaciona cada palabra con su definición en tu contexto profesional.',
        data: {
          pairs: vocab.slice(0, 6).map((word) => ({
            word,
            definition: `Palabra clave en inglés que usas en tu trabajo como ${profession}.`,
          })),
        },
      },
      {
        type: 'transcriptor',
        title: 'Transcripción',
        instructions: 'Escucha el audio y escribe exactamente lo que escuchas.',
        data: { script: listeningScript },
      },
      {
        type: 'image_to_word',
        title: 'Imagen y palabra',
        instructions: 'Observa la imagen, escribe el nombre del objeto y una oración con esa palabra.',
        data: {
          answer: vocab[1],
          hint: 'Objeto que usas todos los días en el trabajo',
          image_prompt: `a close-up photo of ${vocab[1]} on a desk in an office`,
        },
      },
      {
        type: 'sentence_scramble',
        title: 'Ordena las oraciones',
        instructions: 'Ordena las palabras para formar oraciones de correo profesional.',
        data: { sentences: SCRAMBLES },
      },
      {
        type: 'ai_roleplay',
        title: 'Rol con IA',
        instructions: 'Conversa con tu colega estadounidense. Responde al menos dos veces.',
        data: {
          scenario: `Una conversación profesional con un colega estadounidense de tu empresa de ${profession}`,
          level,
          system_prompt:
            `You are a friendly American colleague of ${name} at a ${profession} company. You speak clearly and use simple English appropriate for a ${level} CEFR student. ` +
            `You ask about work, family and weekend plans, and you always encourage the student to keep practicing.`,
          greeting: `Hi ${name}! Great to talk with you today. How is your week at the office going?`,
        },
      },
    ],
  };
};

const generateFromSchema = (schema) => {
  if (!schema) return {};
  if (schema.type === 'object' || !schema.type) {
    const out = {};
    for (const [key, prop] of Object.entries(schema.properties || {})) {
      out[key] = generateFromSchema(prop);
    }
    return out;
  }
  if (schema.type === 'array') {
    const count = Math.max(3, Math.min(10, 3 + Math.floor(Math.random() * 4)));
    return Array.from({ length: count }, () => generateFromSchema(schema.items || { type: 'string' }));
  }
  if (schema.type === 'string') return 'sample text';
  if (schema.type === 'number' || schema.type === 'integer') return 1;
  if (schema.type === 'boolean') return true;
  return null;
};

const integrations = {
  Core: {
    async InvokeLLM({ prompt = '', response_json_schema = null } = {}) {
      await delay(400);
      if (String(prompt).includes('COMPLETE personalized English lesson')) {
        return buildLesson(extractProfile(prompt));
      }
      if (String(prompt).includes('fill-in-the-blanks')) {
        return { exercises: buildGapExercises(levelFromPrompt(prompt)) };
      }
      if (String(prompt).includes('vocabulary words')) {
        return { words: buildWordList(levelFromPrompt(prompt)) };
      }
      if (String(prompt).includes('Conversation so far')) {
        const profession = extractProfile(prompt).profession || 'your work';
        return { content: `That sounds interesting! Tell me more about ${profession}. What do you enjoy most about it?` };
      }
      if (response_json_schema) {
        return generateFromSchema(response_json_schema);
      }
      return { content: 'Here is a sample response for your practice.' };
    },

    async GenerateImage({ prompt = '' } = {}) {
      await delay(300);
      return { url: svgPlaceholder(seedFrom(prompt), 'What is this?') };
    },

    async UploadFile() {
      return { file_url: '' };
    },
  },
};

export const db = { auth, entities, integrations };
export const base44 = db;
export default db;
