import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { validate } from '../lib/validate'
import { AppError } from '../lib/errors'
import { requireAuth, requireRole } from '../middleware/auth'
import { audit } from '../lib/audit'

const router = Router()
router.use(requireAuth, requireRole('ADMIN'))

const idParam = z.object({ id: z.coerce.number().int().positive() })

const createSchema = z.object({
  studentId: z.coerce.number().int().positive(),
  courseId: z.coerce.number().int().positive(),
  paqueteId: z.coerce.number().int().optional().nullable(),
  fechaInicio: z.coerce.date(),
  fechaFin: z.coerce.date().optional().nullable(),
  sesionesContratadas: z.coerce.number().int().min(1),
  estado: z.enum(['ACTIVE', 'PAUSED', 'FINISHED', 'CANCELLED']).optional(),
  precioCOP: z.coerce.number().int().min(0).optional(),
})

const patchSchema = z.object({
  estado: z.enum(['ACTIVE', 'PAUSED', 'FINISHED', 'CANCELLED']).optional(),
  sesionesUsadas: z.coerce.number().int().min(0).optional(),
  sesionesContratadas: z.coerce.number().int().min(1).optional(),
  fechaFin: z.coerce.date().optional().nullable(),
})

// GET /api/enrollments?studentId=&estado=
router.get('/', async (req, res) => {
  const q = validate(
    z.object({
      studentId: z.coerce.number().int().optional(),
      estado: z.enum(['ACTIVE', 'PAUSED', 'FINISHED', 'CANCELLED']).optional(),
    }),
    req.query,
  )

  const enrollments = await prisma.enrollment.findMany({
    where: {
      ...(q.studentId !== undefined ? { studentId: q.studentId } : {}),
      ...(q.estado ? { estado: q.estado } : {}),
    },
    include: {
      student: { select: { id: true, nombre: true, email: true } },
      course: { select: { id: true, titulo: true, nivelMCER: true } },
      paquete: true,
      _count: { select: { sessions: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ data: enrollments })
})

// POST /api/enrollments — matrícula real (admin). Las DEMO solo vienen del seed.
router.post('/', async (req, res) => {
  const data = validate(createSchema, req.body)

  const student = await prisma.user.findUnique({ where: { id: data.studentId } })
  if (!student || student.rol !== 'STUDENT') {
    throw new AppError(400, 'INVALID_STUDENT', 'studentId debe ser un usuario con rol STUDENT')
  }
  const course = await prisma.course.findUnique({ where: { id: data.courseId } })
  if (!course) throw new AppError(404, 'NOT_FOUND', 'Curso no encontrado')

  let precioCOP = data.precioCOP
  if (precioCOP === undefined && data.paqueteId) {
    const paquete = await prisma.package.findUnique({ where: { id: data.paqueteId } })
    if (!paquete) throw new AppError(404, 'NOT_FOUND', 'Paquete no encontrado')
    precioCOP = paquete.precioCOP
  }
  if (precioCOP === undefined) throw new AppError(400, 'PRECIO_REQUERIDO', 'Indica precioCOP o paqueteId')

  const enrollment = await prisma.enrollment.create({
    data: {
      studentId: data.studentId,
      courseId: data.courseId,
      paqueteId: data.paqueteId ?? null,
      fechaInicio: data.fechaInicio,
      fechaFin: data.fechaFin ?? null,
      sesionesContratadas: data.sesionesContratadas,
      sesionesUsadas: 0,
      estado: data.estado ?? 'ACTIVE',
      precioCOP,
      esDemo: false,
    },
  })
  await audit(req.user!.id, 'ENROLLMENT_CREATE', 'Enrollment', enrollment.id)
  res.status(201).json({ data: enrollment })
})

// PATCH /api/enrollments/:id — pausar/cerrar, consumir sesiones
router.patch('/:id', async (req, res) => {
  const { id } = validate(idParam, req.params)
  const data = validate(patchSchema, req.body)

  const existing = await prisma.enrollment.findUnique({ where: { id } })
  if (!existing) throw new AppError(404, 'NOT_FOUND', 'Matrícula no encontrada')

  const enrollment = await prisma.enrollment.update({
    where: { id },
    data: {
      ...(data.estado !== undefined ? { estado: data.estado } : {}),
      ...(data.sesionesUsadas !== undefined ? { sesionesUsadas: data.sesionesUsadas } : {}),
      ...(data.sesionesContratadas !== undefined
        ? { sesionesContratadas: data.sesionesContratadas }
        : {}),
      ...(data.fechaFin !== undefined ? { fechaFin: data.fechaFin } : {}),
    },
  })
  await audit(req.user!.id, 'ENROLLMENT_UPDATE', 'Enrollment', id)
  res.json({ data: enrollment })
})

export default router
