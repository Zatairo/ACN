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
  taskId: z.coerce.number().int().positive().optional().nullable(),
  tipo: z.enum([
    'FILL_BLANKS',
    'WORD_SEARCH',
    'QUIZ',
    'LISTENING',
    'GUIDED_CONVERSATION',
    'ROLE_PLAY',
  ]),
  contenidoJson: z.record(z.any()),
  audioUrl: z.string().url().optional().nullable(),
  nivelMCER: z.enum(['A1', 'A2', 'B1', 'B2', 'C1']),
  estado: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
})

const attemptSchema = z.object({
  puntaje: z.coerce.number().int().min(0).max(100).optional(),
  respuestasJson: z.record(z.any()).optional(),
})

/** CourseIds de las matrículas del estudiante. */
async function studentCourseIds(studentId: number): Promise<number[]> {
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId },
    select: { courseId: true },
  })
  return enrollments.map((e) => e.courseId)
}

// GET /api/activities?courseId=&nivelMCER=&estado=
router.get('/', async (req, res) => {
  const q = validate(
    z.object({
      courseId: z.coerce.number().int().optional(),
      nivelMCER: z.enum(['A1', 'A2', 'B1', 'B2', 'C1']).optional(),
      estado: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
    }),
    req.query,
  )

  const where: Record<string, unknown> = {}
  if (req.user!.rol === 'STUDENT') {
    const ids = await studentCourseIds(req.user!.id)
    if (ids.length === 0) return res.json({ data: [] })
    where.courseId = q.courseId !== undefined && ids.includes(q.courseId) ? q.courseId : { in: ids }
  } else if (q.courseId !== undefined) {
    where.courseId = q.courseId
  }
  if (q.nivelMCER) where.nivelMCER = q.nivelMCER
  if (q.estado) where.estado = q.estado

  const activities = await prisma.practiceActivity.findMany({
    where,
    include: { _count: { select: { attempts: true } } },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ data: activities })
})

// POST /api/activities — TEACHER/ADMIN
router.post('/', requireRole('TEACHER'), async (req, res) => {
  const data = validate(createSchema, req.body)

  const course = await prisma.course.findUnique({ where: { id: data.courseId } })
  if (!course) throw new AppError(404, 'NOT_FOUND', 'Curso no encontrado')
  if (data.taskId) {
    const task = await prisma.task.findUnique({ where: { id: data.taskId } })
    if (!task || task.courseId !== data.courseId) {
      throw new AppError(400, 'INVALID_TASK', 'taskId no existe o no pertenece al curso')
    }
  }

  const activity = await prisma.practiceActivity.create({
    data: {
      courseId: data.courseId,
      taskId: data.taskId ?? null,
      tipo: data.tipo,
      contenidoJson: data.contenidoJson,
      audioUrl: data.audioUrl ?? null,
      nivelMCER: data.nivelMCER,
      estado: data.estado ?? 'PUBLISHED',
    },
  })
  res.status(201).json({ data: activity })
})

// GET /api/activities/:id/attempts — intentos (progreso)
router.get('/:id/attempts', async (req, res) => {
  const { id } = validate(idParam, req.params)

  const activity = await prisma.practiceActivity.findUnique({ where: { id } })
  if (!activity) throw new AppError(404, 'NOT_FOUND', 'Actividad no encontrada')

  const where: Record<string, unknown> = { activityId: id }
  if (req.user!.rol === 'STUDENT') where.studentId = req.user!.id

  const attempts = await prisma.practiceAttempt.findMany({
    where,
    include: { student: { select: { id: true, nombre: true } } },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ data: attempts })
})

// POST /api/activities/:id/attempts — el estudiante registra su intento
// (TEACHER/ADMIN puede registrarlo en clases guiadas)
router.post('/:id/attempts', requireRole('STUDENT', 'TEACHER'), async (req, res) => {
  const { id } = validate(idParam, req.params)
  const data = validate(attemptSchema, req.body)

  const activity = await prisma.practiceActivity.findUnique({ where: { id } })
  if (!activity) throw new AppError(404, 'NOT_FOUND', 'Actividad no encontrada')

  if (req.user!.rol === 'STUDENT') {
    const ids = await studentCourseIds(req.user!.id)
    if (!ids.includes(activity.courseId)) {
      throw new AppError(403, 'FORBIDDEN', 'Solo puedes practicar actividades de tus cursos')
    }
  }

  const attempt = await prisma.practiceAttempt.create({
    data: {
      activityId: id,
      studentId: req.user!.id,
      puntaje: data.puntaje ?? null,
      respuestasJson: data.respuestasJson ?? null,
    },
  })
  res.status(201).json({ data: attempt })
})

export default router
