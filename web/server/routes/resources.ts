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
  moduleId: z.coerce.number().int().positive().optional().nullable(),
  tipo: z.enum(['PDF', 'LINK', 'AUDIO', 'VIDEO', 'DOC']),
  titulo: z.string().min(2),
  url: z.string().min(3),
})

/** CourseIds de las matrículas del estudiante. */
async function studentCourseIds(studentId: number): Promise<number[]> {
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId },
    select: { courseId: true },
  })
  return enrollments.map((e) => e.courseId)
}

// GET /api/resources?courseId= — estudiante solo ve materiales de sus cursos
router.get('/', async (req, res) => {
  const q = validate(
    z.object({ courseId: z.coerce.number().int().optional() }),
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

  const resources = await prisma.resource.findMany({
    where,
    include: {
      uploader: { select: { id: true, nombre: true } },
      module: { select: { id: true, titulo: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ data: resources })
})

// POST /api/resources — TEACHER/ADMIN
router.post('/', requireRole('TEACHER'), async (req, res) => {
  const data = validate(createSchema, req.body)

  const course = await prisma.course.findUnique({ where: { id: data.courseId } })
  if (!course) throw new AppError(404, 'NOT_FOUND', 'Curso no encontrado')
  if (data.moduleId) {
    const module = await prisma.module.findUnique({ where: { id: data.moduleId } })
    if (!module || module.courseId !== data.courseId) {
      throw new AppError(400, 'INVALID_MODULE', 'moduleId no existe o no pertenece al curso')
    }
  }

  const resource = await prisma.resource.create({
    data: {
      courseId: data.courseId,
      moduleId: data.moduleId ?? null,
      tipo: data.tipo,
      titulo: data.titulo,
      url: data.url,
      uploaderId: req.user!.id,
    },
  })
  res.status(201).json({ data: resource })
})

// DELETE /api/resources/:id — TEACHER/ADMIN
router.delete('/:id', requireRole('TEACHER'), async (req, res) => {
  const { id } = validate(idParam, req.params)
  const existing = await prisma.resource.findUnique({ where: { id } })
  if (!existing) throw new AppError(404, 'NOT_FOUND', 'Material no encontrado')

  await prisma.resource.delete({ where: { id } })
  res.json({ data: { deleted: true, id } })
})

export default router
