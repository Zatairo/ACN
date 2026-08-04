// ─────────────────────────────────────────────────────────────
// Seed DEMO del LMS — Fase 1 + Fase 2 (plan F1.E3 y F2)
// ⚠️ Destructivo: borra y recrea los datos de demostración.
// - 6 estudiantes históricos de Students 2025/ → INACTIVE + matrículas
//   esDemo=true: NO son clientes activos, solo casos de prueba.
// - Cuentas ACTIVAS de prueba para F2 (la directora prueba los 3 roles):
//     andrea@acninstitute.com   (ADMIN)   — directora/docente
//     profesora.demo@acn.com     (TEACHER) — docente de prueba
//     estudiante.demo@acn.com    (STUDENT) — estudiante de prueba
//   Todas con password "Demo123!" (temporal, documentada en docs/ARQUITECTURA.md).
// ─────────────────────────────────────────────────────────────
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import fs from 'node:fs'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PASSWORD = 'Demo123!' // temporal, documentada en docs/ARQUITECTURA.md

// Fechas relativas a "ahora" para que el seed siempre muestre clases/tareas vigentes
const DAY = 86_400_000
const inDays = (n: number, hora?: string) => {
  const d = new Date(Date.now() + n * DAY)
  if (hora) {
    const [h, m] = hora.split(':').map(Number)
    d.setHours(h, m, 0, 0)
  }
  return d
}

// Borrar en orden inverso de dependencias (FKs)
async function resetDemo() {
  await prisma.practiceAttempt.deleteMany()
  await prisma.message.deleteMany()
  await prisma.resource.deleteMany()
  await prisma.practiceActivity.deleteMany()
  await prisma.grade.deleteMany()
  await prisma.submission.deleteMany()
  await prisma.task.deleteMany()
  await prisma.session.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.module.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.course.deleteMany()
  await prisma.studentProfile.deleteMany()
  await prisma.lead.deleteMany()
  await prisma.user.deleteMany()
  await prisma.package.deleteMany()
}

// Archivos de demostración para comprobantes/materiales (servidos en /uploads)
function asegurarArchivosDemo() {
  const uploads = path.resolve(process.cwd(), 'server', 'uploads')
  fs.mkdirSync(uploads, { recursive: true })

  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64',
  )
  fs.writeFileSync(path.join(uploads, 'demo-comprobante-nequi.png'), png)

  const pdf = Buffer.from(
    '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF',
    'utf-8',
  )
  fs.writeFileSync(path.join(uploads, 'demo-vocabulario-b1.pdf'), pdf)
}

async function main() {
  console.log('🗑️  Limpiando datos DEMO previos...')
  await resetDemo()
  asegurarArchivosDemo()

  const passwordHash = await bcrypt.hash(PASSWORD, 10)

  // ── 1. Directora / ADMIN (la única cuenta real del seed) ──
  const andrea = await prisma.user.create({
    data: {
      email: 'andrea@acninstitute.com',
      passwordHash,
      nombre: 'Andrea (Directora y docente)',
      telefonoWhatsApp: '+57 300 000 0000', // placeholder — número real pendiente (F5)
      rol: 'ADMIN',
      estado: 'ACTIVE',
    },
  })

  // ── 1b. Cuenta de prueba ACTIVA: profesora demo (F2, rol TEACHER) ──
  const profesora = await prisma.user.create({
    data: {
      email: 'profesora.demo@acn.com',
      passwordHash,
      nombre: 'Profesora Demo (cuenta de prueba)',
      telefonoWhatsApp: '+57 320 000 0008',
      rol: 'TEACHER',
      estado: 'ACTIVE',
    },
  })

  // ── 2. Paquetes (fuente: Services- Andres.docx) ─────────────
  const packages = await prisma.$transaction([
    prisma.package.create({
      data: { nombre: 'Básico', sesiones: 8, vigenciaDias: 30, precioCOP: 360_000, precioPorClase: 45_000 },
    }),
    prisma.package.create({
      data: { nombre: 'Semi Intensivo', sesiones: 12, vigenciaDias: 30, precioCOP: 510_000, precioPorClase: 42_500 },
    }),
    prisma.package.create({
      data: { nombre: 'Bimestral', sesiones: 16, vigenciaDias: 60, precioCOP: 680_000, precioPorClase: 42_500 },
    }),
    prisma.package.create({
      data: { nombre: 'Semi Intensivo Plus', sesiones: 24, vigenciaDias: 60, precioCOP: 990_000, precioPorClase: 41_250 },
    }),
    prisma.package.create({
      data: { nombre: 'Trimestral', sesiones: 36, vigenciaDias: 90, precioCOP: 1_350_000, precioPorClase: 37_500 },
    }),
  ])
  const [pBasico, pSemi, pBimestral, pSemiPlus, pTrimestral] = packages

  // ── 3. Estudiantes históricos (INACTIVE = solo DEMO) ────────
  const estudiantes = [
    {
      email: 'andres.carrillo@demo.acn',
      nombre: 'Andrés Carrillo',
      telefono: '+57 310 000 0001',
      nivel: 'B1' as const,
      proposito: 'Inglés para su trabajo en una empresa de energía solar',
      industria: 'Energía solar / Tecnología',
      profesion: 'Profesional en empresa de energía solar (Monalee)',
      intereses: 'Energía solar, paneles solares, tecnología, presentaciones',
      contexto: 'Presentaciones PechaKucha, listening sobre el rol de los paneles solares, reuniones laborales',
      objetivo: 'Comunicarse con fluidez en reuniones y presentaciones de su industria',
      horarios: 'Lunes 7:00am · Miércoles 5:00pm (COL)',
      notas: 'Histórico 2025 — Paquete Semi Intensivo. RAG: energía solar.',
      rag: {
        intereses: ['energía solar', 'tecnología', 'paneles solares', 'empresa Monalee'],
        vocabularioClave: ['solar panels', 'renewable energy', 'photovoltaic', 'energy efficiency', 'solar installation'],
        restricciones: ['B1', 'vocabulario técnico de su industria'],
      },
      paquete: pSemi,
      fechaInicio: new Date('2025-01-06T00:00:00-05:00'),
      sesionesUsadas: 8,
    },
    {
      email: 'milena.bautista@demo.acn',
      nombre: 'Milena Bautista',
      telefono: '+57 311 000 0002',
      nivel: 'B1' as const,
      proposito: 'Presentar su investigación en inglés (conferencias y podcast)',
      industria: 'Innovación social en salud',
      profesion: 'Investigadora en innovación social en salud',
      intereses: 'Salud pública, comunidades indígenas, fiebre amarilla, Chagas',
      contexto: 'Investigación sobre fiebre amarilla en comunidades indígenas, podcast EYE on yellow fever, PhD en innovación social',
      objetivo: 'Exponer investigación en conferencias y podcasts en inglés',
      horarios: 'Martes 12:00pm · Jueves 5:00pm (COL)',
      notas: 'Histórico 2025 — Paquete Semi Intensivo. RAG: innovación social en salud.',
      rag: {
        intereses: ['salud pública', 'comunidades indígenas', 'fiebre amarilla', 'Chagas', 'modelos rurales de atención'],
        vocabularioClave: ['yellow fever', 'social innovation', 'indigenous communities', 'health research', 'rural health care'],
        restricciones: ['B1', 'registro académico y divulgación'],
      },
      paquete: pSemi,
      fechaInicio: new Date('2025-01-13T00:00:00-05:00'),
      sesionesUsadas: 6,
    },
    {
      email: 'jenifer.roman@demo.acn',
      nombre: 'Jenifer Román',
      telefono: '+57 312 000 0003',
      nivel: 'B1' as const,
      proposito: 'Inglés para la vida diaria y su trabajo en bienes raíces',
      industria: 'Bienes raíces',
      profesion: 'Sector inmobiliario',
      intereses: 'Propiedades, Filandia (Quindío), vida diaria, viajes',
      contexto: 'Venta de apartamentos (Filandia, Quindío), listening de bienes raíces, guías de viaje y vida diaria',
      objetivo: 'Atender clientes y describir propiedades en inglés con confianza',
      horarios: 'Lunes 5:00pm · Viernes 12:00pm (COL)',
      notas: 'Histórico 2025 — Paquete Semi Intensivo. RAG: bienes raíces + vida diaria.',
      rag: {
        intereses: ['bienes raíces', 'apartamentos', 'vida diaria', 'viajes por Colombia'],
        vocabularioClave: ['real estate', 'apartment for sale', 'property', 'neighborhood', 'for rent'],
        restricciones: ['B1', 'tareas con audio de su campo (RealState)'],
      },
      paquete: pSemi,
      fechaInicio: new Date('2025-02-03T00:00:00-05:00'),
      sesionesUsadas: 4,
    },
    {
      email: 'luciana.castaneda@demo.acn',
      nombre: 'Luciana Castañeda (Kids)',
      telefono: '+57 313 000 0004',
      nivel: 'A1' as const,
      proposito: 'Refuerzo escolar de inglés',
      industria: 'Escolar (niña)',
      profesion: 'Estudiante escolar',
      intereses: 'Juegos, actividades lúdicas, colores, animales, escuela',
      contexto: 'Refuerzo escolar con supervisión de acudiente; actividades lúdicas (word search, fill-blanks), reportes escolares',
      objetivo: 'Mejorar sus notas y ganar confianza en inglés básico',
      horarios: 'Sábado 2:00pm (COL)',
      notas: 'Histórico 2025 — ACN KIDS, Paquete Básico. RAG: kids, nivel escolar.',
      rag: {
        intereses: ['juegos', 'animales', 'colores', 'números', 'actividades escolares'],
        vocabularioClave: ['school', 'family', 'colors', 'numbers', 'animals', 'toys'],
        restricciones: ['A1', 'niña — actividades lúdicas y supervisión de acudiente'],
      },
      paquete: pBasico,
      fechaInicio: new Date('2025-02-10T00:00:00-05:00'),
      sesionesUsadas: 5,
    },
    {
      email: 'nico@demo.acn',
      nombre: 'Nico',
      telefono: '+57 314 000 0005',
      nivel: 'A2' as const,
      proposito: 'Conversación y confianza',
      industria: 'Conversación cotidiana',
      profesion: '—',
      intereses: 'Conversación, confianza al hablar, vida diaria, viajes',
      contexto: 'Clases compartidas con Juanita (2 estudiantes, 1 matrícula); enfoque en conversación y confianza',
      objetivo: 'Hablar con fluidez y naturalidad en conversaciones cotidianas',
      horarios: 'Lunes 7:00am · Miércoles 7:00am (COL)',
      notas: 'Histórico 2025 — Paquete Básico. Sesiones compartidas con Juanita (misma matrícula).',
      rag: {
        intereses: ['conversación', 'vida diaria', 'viajes', 'amigos'],
        vocabularioClave: ['daily routines', 'hobbies', 'travel', 'food', 'friends'],
        restricciones: ['A2', 'sesiones compartidas con Juanita'],
      },
      paquete: pBasico,
      fechaInicio: new Date('2025-03-03T00:00:00-05:00'),
      sesionesUsadas: 9,
    },
    {
      email: 'juanita@demo.acn',
      nombre: 'Juanita',
      telefono: '+57 314 000 0006',
      nivel: 'A2' as const,
      proposito: 'Conversación y confianza',
      industria: 'Conversación cotidiana',
      profesion: '—',
      intereses: 'Conversación, música, vida diaria',
      contexto: 'Clases compartidas con Nico (misma matrícula); conversación guiada',
      objetivo: 'Ganar confianza para hablar en inglés',
      horarios: 'Lunes 7:00am · Miércoles 7:00am (COL)',
      notas: 'Histórico 2025 — Paquete Básico (compartido con Nico, matrícula única).',
      rag: {
        intereses: ['conversación', 'música', 'vida diaria'],
        vocabularioClave: ['daily routines', 'music', 'feelings', 'weekend plans'],
        restricciones: ['A2', 'sesiones compartidas con Nico'],
      },
      paquete: pBasico,
      fechaInicio: new Date('2025-03-03T00:00:00-05:00'),
      sesionesUsadas: 0, // sin matrícula propia: comparte la de Nico
      sinMatricula: true,
    },
    {
      email: 'gabriela@demo.acn',
      nombre: 'Gabriela (Yoga)',
      telefono: '+57 315 000 0007',
      nivel: 'B2' as const,
      proposito: 'Speaking fluido',
      industria: 'Yoga / Bienestar',
      profesion: 'Instructora de yoga',
      intereses: 'Yoga, meditación, bienestar, conversación guiada',
      contexto: 'Paquete de speaking con conversación guiada; audios de práctica y rúbrica de speaking',
      objetivo: 'Speaking fluido y natural para enseñar y conversar',
      horarios: 'Martes 5:00pm · Jueves 12:00pm (COL)',
      notas: 'Histórico 2025 — Paquete Semi Intensivo. RAG: yoga/bienestar.',
      rag: {
        intereses: ['yoga', 'meditación', 'bienestar', 'salud'],
        vocabularioClave: ['yoga', 'meditation', 'wellness', 'breathing', 'balance', 'mindfulness'],
        restricciones: ['B2', 'speaking con entrega de audio y rúbrica'],
      },
      paquete: pSemi,
      fechaInicio: new Date('2025-01-20T00:00:00-05:00'),
      sesionesUsadas: 10,
    },
  ]

  const historicos: { user: { id: number; nombre: string }; matricula: { id: number } }[] = []
  for (const e of estudiantes) {
    const user = await prisma.user.create({
      data: {
        email: e.email,
        passwordHash,
        nombre: e.nombre,
        telefonoWhatsApp: e.telefono,
        rol: 'STUDENT',
        estado: 'INACTIVE', // histórico/demo: NO puede iniciar sesión
      },
    })

    await prisma.studentProfile.create({
      data: {
        userId: user.id,
        nivelMCER: e.nivel,
        proposito: e.proposito,
        industria: e.industria,
        profesion: e.profesion,
        intereses: e.intereses,
        contextoProfesional: e.contexto,
        objetivo: e.objetivo,
        horariosPreferidos: e.horarios,
        notasDocente: e.notas,
        datosRAG: e.rag,
      },
    })

    // Juanita comparte la matrícula y el curso de Nico: sin curso ni matrícula propios
    if ('sinMatricula' in e && e.sinMatricula) continue

    // 1 curso personalizado por estudiante (plan: "6 cursos iniciales = 1 por estudiante")
    const curso = await prisma.course.create({
      data: {
        titulo: `Curso personalizado — ${e.industria} (${e.nivel})`,
        nivelMCER: e.nivel,
        descripcion: `Curso 100% personalizado para ${e.nombre}. ${e.proposito}.`,
        modalidad: 'ZOOM',
        estado: 'ACTIVE',
        teacherId: andrea.id,
        paqueteId: e.paquete.id,
      },
    })

    // Matrícula DEMO (esDemo=true) — nunca una matrícula real activa
    const matricula = await prisma.enrollment.create({
      data: {
        studentId: user.id,
        courseId: curso.id,
        paqueteId: e.paquete.id,
        fechaInicio: e.fechaInicio,
        fechaFin: new Date(e.fechaInicio.getTime() + e.paquete.vigenciaDias * DAY),
        sesionesContratadas: e.paquete.sesiones,
        sesionesUsadas: e.sesionesUsadas,
        estado: 'ACTIVE',
        precioCOP: e.paquete.precioCOP,
        esDemo: true,
      },
    })

    historicos.push({ user, matricula })
  }

  // ── 4. Cuenta de prueba ACTIVA: estudiante demo (F2, rol STUDENT) ──
  const estudiante = await prisma.user.create({
    data: {
      email: 'estudiante.demo@acn.com',
      passwordHash,
      nombre: 'Estudiante Demo (cuenta de prueba)',
      telefonoWhatsApp: '+57 321 000 0009',
      rol: 'STUDENT',
      estado: 'ACTIVE',
    },
  })

  const cursoDemo = await prisma.course.create({
    data: {
      titulo: 'Curso personalizado — Tecnología y trabajo (B1)',
      nivelMCER: 'B1',
      descripcion: 'Curso de prueba para validar el módulo de estudiante: tecnología, reuniones y presentaciones en inglés.',
      modalidad: 'ZOOM',
      estado: 'ACTIVE',
      teacherId: profesora.id,
      paqueteId: pSemi.id,
    },
  })

  const matriculaDemo = await prisma.enrollment.create({
    data: {
      studentId: estudiante.id,
      courseId: cursoDemo.id,
      paqueteId: pSemi.id,
      fechaInicio: inDays(-20),
      fechaFin: inDays(10),
      sesionesContratadas: pSemi.sesiones,
      sesionesUsadas: 4, // quedan 8 para mostrar saldo en el dashboard
      estado: 'ACTIVE',
      precioCOP: pSemi.precioCOP,
      esDemo: true, // matrícula DEMO de prueba (no es un cliente real)
    },
  })

  await prisma.studentProfile.create({
    data: {
      userId: estudiante.id,
      nivelMCER: 'B1',
      proposito: 'Mejorar su inglés para reuniones y presentaciones laborales',
      industria: 'Tecnología',
      profesion: 'Profesional en tecnología',
      intereses: 'Tecnología, startups, viajes, música',
      contextoProfesional: 'Reuniones semanales con equipo internacional, presentaciones de producto',
      objetivo: 'Sentirse seguro en reuniones y escribir correos profesionales',
      horariosPreferidos: 'Lunes 7:00am · Miércoles 12:00pm (COL)',
      notasDocente: 'Cuenta ACTIVA de prueba (F2) — la directora valida el módulo de estudiante.',
      datosRAG: {
        intereses: ['tecnología', 'startups', 'reuniones', 'presentaciones'],
        vocabularioClave: ['meeting', 'deadline', 'presentation', 'feedback', 'milestone'],
        restricciones: ['B1', 'enfoque profesional'],
      },
    },
  })

  // ── 5. Sesiones demo (agenda de la profesora demo + próximo de estudiante.demo) ──
  const sesionesDemo = [
    // Pasadas COMPLETADAS del estudiante demo (historial)
    { enrollmentId: matriculaDemo.id, fechaHora: inDays(-12, '7:00'), estado: 'COMPLETED' as const, tema: 'Introducción y objetivos del curso', asistio: true },
    { enrollmentId: matriculaDemo.id, fechaHora: inDays(-9, '12:00'), estado: 'COMPLETED' as const, tema: 'Present simple for routines', asistio: true },
    // Próximas del estudiante demo
    { enrollmentId: matriculaDemo.id, fechaHora: inDays(1, '7:00'), estado: 'SCHEDULED' as const, tema: 'Reuniones: agenda y turnos de palabra', enlace: 'https://meet.google.com/acn-demo-123' },
    { enrollmentId: matriculaDemo.id, fechaHora: inDays(4, '12:00'), estado: 'SCHEDULED' as const, tema: 'Presentaciones: estructura y vocabulario', enlace: 'https://meet.google.com/acn-demo-456' },
    // Próxima de un histórico (para que la agenda de la profesora demo tenga más clases)
    {
      enrollmentId: historicos[0].matricula.id,
      fechaHora: inDays(2, '17:00'),
      estado: 'SCHEDULED' as const,
      tema: 'Energía solar: descripción de instalaciones',
      enlace: 'https://zoom.us/j/demo-acn-789',
    },
  ]

  for (const s of sesionesDemo) {
    await prisma.session.create({
      data: {
        enrollmentId: s.enrollmentId,
        teacherId: profesora.id,
        fechaHora: s.fechaHora,
        duracionMin: 45,
        estado: s.estado,
        enlaceVideo: s.enlace ?? null,
        tema: s.tema,
        notasClase: s.asistio ? 'Clase desarrollada según lo planeado. Repasar vocabulario visto.' : null,
        asistio: s.asistio ?? null,
        creadaPor: 'PROFESORA',
      },
    })
  }

  // ── 6. Tareas demo del estudiante (ASSIGNED / SUBMITTED / GRADED) ──
  const t1 = await prisma.task.create({
    data: {
      courseId: cursoDemo.id,
      studentId: estudiante.id,
      teacherId: profesora.id,
      tipo: 'CONVERSACION',
      titulo: 'Conversación guiada: tu semana laboral',
      descripcion: 'Graba un audio de 2 minutos describiendo tu semana laboral: reuniones, pendientes y cómo priorizas. Usa el vocabulario de la clase.',
      nivelMCER: 'B1',
      fechaLimite: inDays(4),
      estado: 'ASSIGNED',
    },
  })

  const t2 = await prisma.task.create({
    data: {
      courseId: cursoDemo.id,
      studentId: estudiante.id,
      teacherId: profesora.id,
      tipo: 'ESCRITURA',
      titulo: 'Email a tu manager sobre un entregable',
      descripcion: 'Escribe un correo breve (120–150 palabras) informando el avance de tu entregable y proponiendo una nueva fecha límite.',
      nivelMCER: 'B1',
      fechaLimite: inDays(-2),
      estado: 'SUBMITTED',
    },
  })
  await prisma.submission.create({
    data: {
      taskId: t2.id,
      studentId: estudiante.id,
      contenidoTexto: 'Hi Maria,\n\nI wanted to update you on the report. I am almost done, but I need two more days to review the final numbers. Could we move the deadline to Friday? I will send you the draft tomorrow.\n\nBest regards,\nDemo Student',
      estado: 'SUBMITTED',
    },
  })

  const t3 = await prisma.task.create({
    data: {
      courseId: cursoDemo.id,
      studentId: estudiante.id,
      teacherId: profesora.id,
      tipo: 'VOCABULARIO',
      titulo: 'Vocabulario de reuniones (quiz)',
      descripcion: 'Repasa el vocabulario de reuniones (agenda, follow-up, action items) y resuelve el quiz de la lección.',
      nivelMCER: 'B1',
      fechaLimite: inDays(-6),
      estado: 'GRADED',
    },
  })
  const sub3 = await prisma.submission.create({
    data: {
      taskId: t3.id,
      studentId: estudiante.id,
      contenidoTexto: 'Respuestas del quiz completadas en la plataforma.',
      estado: 'REVIEWED',
    },
  })
  await prisma.grade.create({
    data: {
      taskId: t3.id,
      submissionId: sub3.id,
      nota: 85,
      rubricaJson: {
        precisionVocabulario: 80,
        usoGramatical: 85,
        cumplimientoConsigna: 90,
        total: 85,
      },
      feedback: 'Muy buen trabajo con el vocabulario de reuniones. Refuerza "follow-up" como sustantivo y revisa el uso de preposiciones en "meet with".',
      evaluadoPor: profesora.id,
    },
  })

  // ── 7. Pagos demo del estudiante (APROBADO / PENDIENTE / VENCIDO) ──
  await prisma.payment.createMany({
    data: [
      {
        studentId: estudiante.id,
        enrollmentId: matriculaDemo.id,
        concepto: 'Paquete Semi Intensivo — mensualidad',
        valorCOP: pSemi.precioCOP,
        metodo: 'NEQUI',
        estado: 'APROBADO',
        fecha: inDays(-15),
        referencia: 'Pago demo aprobado',
      },
      {
        studentId: estudiante.id,
        enrollmentId: matriculaDemo.id,
        concepto: 'Paquete Semi Intensivo — renovación',
        valorCOP: pSemi.precioCOP,
        metodo: 'NEQUI',
        estado: 'PENDIENTE',
        fecha: inDays(-1),
        referencia: 'Comprobante Nequi #88412',
        comprobanteUrl: '/uploads/demo-comprobante-nequi.png',
      },
      {
        studentId: estudiante.id,
        enrollmentId: matriculaDemo.id,
        concepto: 'Mensualidad anterior (Básico)',
        valorCOP: pBasico.precioCOP,
        metodo: 'DAVIVIENDA',
        estado: 'VENCIDO',
        fecha: inDays(-40),
        referencia: 'Pago no recibido — alerta de mora',
      },
    ],
  })

  // ── 8. Prácticas demo del curso (FILL_BLANKS / WORD_SEARCH / QUIZ / LISTENING) ──
  await prisma.practiceActivity.createMany({
    data: [
      {
        courseId: cursoDemo.id,
        tipo: 'FILL_BLANKS',
        contenidoJson: {
          titulo: 'Completa las frases de reuniones',
          instrucciones: 'Escribe la palabra correcta en cada espacio en blanco.',
          ejercicios: [
            { sentence: 'The meeting starts at 9 am, so please be on ___ .', answer: 'time', hint: 't___ (4 letters)' },
            { sentence: 'Let me write the main ___ items before we finish.', answer: 'action', hint: 'a_____ (6 letters)' },
            { sentence: 'I will send a ___ after the meeting with the summary.', answer: 'follow-up', hint: 'f______-__ (9 letters)' },
          ],
        },
        nivelMCER: 'B1',
        estado: 'PUBLISHED',
      },
      {
        courseId: cursoDemo.id,
        tipo: 'WORD_SEARCH',
        contenidoJson: {
          titulo: 'Sopa de letras: vocabulario de tecnología',
          instrucciones: 'Encuentra las palabras ocultas en la cuadrícula.',
          palabras: ['meeting', 'deadline', 'report', 'agenda', 'client', 'project'],
        },
        nivelMCER: 'B1',
        estado: 'PUBLISHED',
      },
      {
        courseId: cursoDemo.id,
        tipo: 'QUIZ',
        contenidoJson: {
          titulo: 'Quiz: presentaciones en inglés',
          instrucciones: 'Elige la respuesta correcta.',
          preguntas: [
            {
              pregunta: 'How do you introduce the next slide politely?',
              opciones: ['Now I will talk about...', 'Shut up and look.', 'Give me the report.'],
              respuesta: 0,
              explicacion: '"Now I will talk about..." es una transición educada entre secciones.',
            },
            {
              pregunta: 'What does "action item" mean in a meeting?',
              opciones: ['A task assigned to someone', 'A coffee break', 'The meeting room'],
              respuesta: 0,
              explicacion: 'Un action item es una tarea concreta asignada a alguien.',
            },
            {
              pregunta: 'Which phrase asks for feedback?',
              opciones: ['Any questions so far?', 'I am the boss.', 'See you later.'],
              respuesta: 0,
              explicacion: '"Any questions so far?" invita al público a participar.',
            },
          ],
        },
        nivelMCER: 'B1',
        estado: 'PUBLISHED',
      },
      {
        courseId: cursoDemo.id,
        tipo: 'LISTENING',
        contenidoJson: {
          titulo: 'Listening: la agenda de la semana',
          instrucciones: 'Escucha el audio (disponible en Fase 3 con ElevenLabs) y responde.',
          guion: 'Good morning team. This week we have three important meetings: Monday is our weekly sync, Wednesday we review the project with the client, and Friday is the presentation rehearsal. Please check the agenda and add your updates.',
          preguntas: [
            { pregunta: '¿Qué día es el sync semanal?', respuesta: 'Lunes' },
            { pregunta: '¿Qué se revisa el miércoles?', respuesta: 'El proyecto con el cliente' },
            { pregunta: '¿Qué ensayo hay el viernes?', respuesta: 'La presentación' },
          ],
        },
        nivelMCER: 'B1',
        estado: 'PUBLISHED',
      },
    ],
  })

  // ── 9. Recursos demo del curso ──
  await prisma.resource.createMany({
    data: [
      {
        courseId: cursoDemo.id,
        tipo: 'PDF',
        titulo: 'Vocabulario B1 — reuniones y presentaciones',
        url: '/uploads/demo-vocabulario-b1.pdf',
        uploaderId: profesora.id,
      },
      {
        courseId: cursoDemo.id,
        tipo: 'LINK',
        titulo: 'Guía rápida: cómo dar feedback en inglés',
        url: 'https://learnenglish.britishcouncil.org/business-english',
        uploaderId: profesora.id,
      },
    ],
  })

  // ── 10. Mensajes demo (chat estudiante ↔ profesora) ──
  await prisma.message.createMany({
    data: [
      {
        remitenteId: profesora.id,
        destinatarioId: estudiante.id,
        tipo: 'MENSAJE',
        contenido: '¡Hola! Te dejé la tarea de conversación guiada para esta semana. Cualquier duda me escribes.',
        leido: false,
        fecha: inDays(-1),
      },
      {
        remitenteId: estudiante.id,
        destinatarioId: profesora.id,
        tipo: 'MENSAJE',
        contenido: '¡Hola profe! La entrego el jueves sin falta.',
        leido: true,
        fecha: new Date(inDays(-1).getTime() + 3_600_000),
      },
      {
        remitenteId: profesora.id,
        destinatarioId: estudiante.id,
        tipo: 'RECORDATORIO',
        contenido: 'Recuerda tu clase del martes a las 7:00 am. Te espero con el enlace de Meet.',
        leido: false,
        fecha: inDays(0),
      },
    ],
  })

  // ── 11. Leads demo (CRM admin: kanban NUEVO → CERRADO) ──
  await prisma.lead.createMany({
    data: [
      { nombre: 'Carolina Gómez', telefonoWhatsApp: '+57 322 000 0010', canal: 'WEB', estado: 'NUEVO', nivelEstimado: 'A2', notas: 'Llenó formulario del sitio. Interesada en Semi Intensivo.', fecha: inDays(-1) },
      { nombre: 'Felipe Rojas', telefonoWhatsApp: '+57 323 000 0011', canal: 'IG', estado: 'CONTACTADO', nivelEstimado: 'B1', notas: 'Contactado por DM. Quiere clase de diagnóstico.', fecha: inDays(-3) },
      { nombre: 'María Torres', telefonoWhatsApp: '+57 324 000 0012', canal: 'REFERIDO', estado: 'OFERTA', nivelEstimado: 'A1', notas: 'Referida por Gabriela. Le envié precios del paquete Básico.', fecha: inDays(-6) },
      { nombre: 'Juan Pablo Ospina', telefonoWhatsApp: '+57 325 000 0013', canal: 'FOLLETO', estado: 'CERRADO', nivelEstimado: 'B2', notas: 'Se matriculó en Bimestral. Primera clase el lunes.', fecha: inDays(-9) },
      { nombre: 'Lucía Vélez', telefonoWhatsApp: '+57 326 000 0014', canal: 'TIKTOK', estado: 'PERDIDO', nivelEstimado: null, notas: 'No respondió después del tercer intento.', fecha: inDays(-12) },
    ],
  })

  // ── Resumen ───────────────────────────────────────────────
  console.log('Seed DEMO completado:')
  console.log(`  · Admin: ${andrea.email} (ACTIVE) — password "${PASSWORD}"`)
  console.log(`  · Profesora demo: ${profesora.email} (TEACHER, ACTIVE) — password "${PASSWORD}"`)
  console.log(`  · Estudiante demo: ${estudiante.email} (STUDENT, ACTIVE) — password "${PASSWORD}"`)
  console.log(`  · Estudiantes históricos DEMO (INACTIVE): 6 (Nico y Juanita como 2 cuentas, matrícula compartida)`)
  console.log(`  · Paquetes: ${packages.map((p) => `${p.nombre} $${p.precioCOP.toLocaleString('es-CO')}`).join(', ')}`)
  console.log(`  · Matrículas DEMO (esDemo): ${historicos.length + 1} (6 históricas + 1 de estudiante.demo)`)
  console.log(`  · Sesiones demo: ${sesionesDemo.length} · Tareas demo: 3 · Pagos demo: 3 · Prácticas: 4 · Mensajes: 3 · Leads: 5`)
}

main()
  .catch((err) => {
    console.error('Error ejecutando el seed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
