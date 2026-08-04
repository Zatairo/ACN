import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { validate } from '../lib/validate'
import { AppError } from '../lib/errors'
import { requireAuth, requireRole } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

const idParam = z.object({ id: z.coerce.number().int().positive() })

const createSchema = z.object({
  courseId: z.coerce.number().int().positive(),
  studentId: z.coerce.number().int().positive(),
  tipo: z.enum(['CONVERSACION', 'ESCRITURA', 'LECTURA', 'LISTENING', 'VOCABULARIO', 'EXAMEN']),
  titulo: z.string().min(3, 'Título requerido'),
  descripcion: z.string().optional().nullable(),
  nivelMCER: z.enum(['A1', 'A2', 'B1', 'B2', 'C1']),
  fechaLimite: z.coerce.date().optional().nullable(),
  audioUrl: z.string().url().optional().nullable(),
})

const patchSchema = z.object({
  titulo: z.string().min(3).optional(),
  descripcion: z.string().optional().nullable(),
  fechaLimite: z.coerce.date().optional().nullable(),
  estado: z.enum(['ASSIGNED', 'SUBMITTED', 'GRADED', 'EXPIRED']).optional(),
  audioUrl: z.string().url().optional().nullable(),
})

const submissionSchema = z
  .object({
    contenidoTexto: z.string().optional().nullable(),
    archivoUrl: z.string().optional().nullable(),
    audioUrl: z.string().optional().nullable(),
  })
  .refine((v) => v.contenidoTexto || v.archivoUrl || v.audioUrl, {
    message: 'Entrega al menos contenidoTexto, archivoUrl o audioUrl',
  })

const gradeSchema = z.object({
  submissionId: z.coerce.number().int().positive(),
  nota: z.coerce.number().int().min(0).max(100),
  rubricaJson: z.record(z.any()).optional().nullable(),
  feedback: z.string().optional().nullable(),
  feedbackAudioUrl: z.string().optional().nullable(),
})

// GET /api/tasks?studentId=&courseId=&estado=&tipo=
router.get('/', async (req, res) => {
  const q = validate(
    z.object({
      studentId: z.coerce.number().int().optional(),
      courseId: z.coerce.number().int().optional(),
      estado: z.enum(['ASSIGNED', 'SUBMITTED', 'GRADED', 'EXPIRED']).optional(),
      tipo: z.enum(['CONVERSACION', 'ESCRITURA', 'LECTURA', 'LISTENING', 'VOCABULARIO', 'EXAMEN']).optional(),
    }),
    req.query,
  )

  const where: Record<string, unknown> = {}
  if (req.user!.rol === 'STUDENT') {
    where.studentId = req.user!.id
  } else if (req.user!.rol === 'TEACHER') {
    where.teacherId = req.user!.id
  } else {
    if (q.studentId !== undefined) where.studentId = q.studentId
  }
  if (q.courseId !== undefined) where.courseId = q.courseId
  if (q.estado) where.estado = q.estado
  if (q.tipo) where.tipo = q.tipo

  const tasks = await prisma.task.findMany({
    where,
    include: {
      student: { select: { id: true, nombre: true } },
      course: { select: { id: true, titulo: true } },
      submissions: { orderBy: { fechaEntrega: 'desc' } },
      grades: true,
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ data: tasks })
})

// POST /api/tasks — TEACHER/ADMIN
router.post('/', requireRole('TEACHER'), async (req, res) => {
  const data = validate(createSchema, req.body)

  const [course, student] = await Promise.all([
    prisma.course.findUnique({ where: { id: data.courseId } }),
    prisma.user.findUnique({ where: { id: data.studentId } }),
  ])
  if (!course) throw new AppError(404, 'NOT_FOUND', 'Curso no encontrado')
  if (!student || student.rol !== 'STUDENT') {
    throw new AppError(400, 'INVALID_STUDENT', 'studentId debe ser un usuario con rol STUDENT')
  }

  const task = await prisma.task.create({
    data: {
      courseId: data.courseId,
      studentId: data.studentId,
      teacherId: req.user!.id,
      tipo: data.tipo,
      titulo: data.titulo,
      descripcion: data.descripcion ?? null,
      nivelMCER: data.nivelMCER,
      fechaLimite: data.fechaLimite ?? null,
      audioUrl: data.audioUrl ?? null,
      estado: 'ASSIGNED',
    },
  })
  res.status(201).json({ data: task })
})

// PATCH /api/tasks/:id — TEACHER/ADMIN
router.patch('/:id', requireRole('TEACHER'), async (req, res) => {
  const { id } = validate(idParam, req.params)
  const data = validate(patchSchema, req.body)

  const existing = await prisma.task.findUnique({ where: { id } })
  if (!existing) throw new AppError(404, 'NOT_FOUND', 'Tarea no encontrada')

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...(data.titulo !== undefined ? { titulo: data.titulo } : {}),
      ...(data.descripcion !== undefined ? { descripcion: data.descripcion } : {}),
      ...(data.fechaLimite !== undefined ? { fechaLimite: data.fechaLimite } : {}),
      ...(data.estado !== undefined ? { estado: data.estado } : {}),
      ...(data.audioUrl !== undefined ? { audioUrl: data.audioUrl } : {}),
    },
  })
  res.json({ data: task })
})

// GET /api/tasks/:id — detalle con entregas y calificaciones (alcance por rol)
router.get('/:id', async (req, res) => {
  const { id } = validate(idParam, req.params)

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, nombre: true, email: true } },
      teacher: { select: { id: true, nombre: true } },
      course: { select: { id: true, titulo: true, nivelMCER: true } },
      submissions: {
        include: { grades: true },
        orderBy: { fechaEntrega: 'desc' },
      },
    },
  })
  if (!task) throw new AppError(404, 'NOT_FOUND', 'Tarea no encontrada')

  if (req.user!.rol === 'STUDENT' && task.studentId !== req.user!.id) {
    throw new AppError(403, 'FORBIDDEN', 'No puedes ver esta tarea')
  }
  if (req.user!.rol === 'TEACHER' && task.teacherId !== req.user!.id) {
    throw new AppError(403, 'FORBIDDEN', 'No puedes ver esta tarea')
  }

  res.json({ data: task })
})

// POST /api/tasks/:id/submissions — el estudiante dueño de la tarea
// (TEACHER/ADMIN también puede registrar la entrega en clases guiadas, plan F4.B)
router.post('/:id/submissions', requireRole('STUDENT', 'TEACHER'), async (req, res) => {
  const { id } = validate(idParam, req.params)
  const data = validate(submissionSchema, req.body)

  const task = await prisma.task.findUnique({ where: { id } })
  if (!task) throw new AppError(404, 'NOT_FOUND', 'Tarea no encontrada')
  if (req.user!.rol === 'STUDENT' && task.studentId !== req.user!.id) {
    throw new AppError(403, 'FORBIDDEN', 'Solo el estudiante asignado puede entregar esta tarea')
  }
  if (task.estado === 'GRADED') {
    throw new AppError(409, 'ALREADY_GRADED', 'La tarea ya fue calificada')
  }

  const submission = await prisma.submission.create({
    data: {
      taskId: id,
      studentId: req.user!.id,
      contenidoTexto: data.contenidoTexto ?? null,
      archivoUrl: data.archivoUrl ?? null,
      audioUrl: data.audioUrl ?? null,
      estado: 'SUBMITTED',
    },
  })
  if (task.estado === 'ASSIGNED') {
    await prisma.task.update({ where: { id }, data: { estado: 'SUBMITTED' } })
  }
  res.status(201).json({ data: submission })
})

// POST /api/tasks/:id/grades — TEACHER/ADMIN con rúbrica JSON
router.post('/:id/grades', requireRole('TEACHER'), async (req, res) => {
  const { id } = validate(idParam, req.params)
  const data = validate(gradeSchema, req.body)

  const task = await prisma.task.findUnique({ where: { id } })
  if (!task) throw new AppError(404, 'NOT_FOUND', 'Tarea no encontrada')

  const submission = await prisma.submission.findUnique({ where: { id: data.submissionId } })
  if (!submission || submission.taskId !== id) {
    throw new AppError(400, 'INVALID_SUBMISSION', 'La entrega no pertenece a esta tarea')
  }

  const grade = await prisma.grade.create({
    data: {
      taskId: id,
      submissionId: data.submissionId,
      nota: data.nota,
      rubricaJson: data.rubricaJson ?? null,
      feedback: data.feedback ?? null,
      feedbackAudioUrl: data.feedbackAudioUrl ?? null,
      evaluadoPor: req.user!.id,
    },
  })
  await prisma.$transaction([
    prisma.task.update({ where: { id }, data: { estado: 'GRADED' } }),
    prisma.submission.update({ where: { id: data.submissionId }, data: { estado: 'REVIEWED' } }),
  ])
  res.status(201).json({ data: grade })
})

export default router
