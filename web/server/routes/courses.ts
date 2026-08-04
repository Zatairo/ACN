import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { validate } from '../lib/validate'
import { AppError } from '../lib/errors'
import { requireAuth, requireRole } from '../middleware/auth'

const router = Router()
router.use(requireAuth, requireRole('TEACHER'))

const idParam = z.object({ id: z.coerce.number().int().positive() })

const createSchema = z.object({
  titulo: z.string().min(3, 'Título requerido'),
  nivelMCER: z.enum(['A1', 'A2', 'B1', 'B2', 'C1']),
  descripcion: z.string().optional().nullable(),
  modalidad: z.string().optional(),
  estado: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
  teacherId: z.coerce.number().int().optional(),
  paqueteId: z.coerce.number().int().optional().nullable(),
})

const patchSchema = createSchema.partial()

const moduleSchema = z.object({
  orden: z.coerce.number().int().min(0),
  titulo: z.string().min(2),
  descripcion: z.string().optional().nullable(),
  estado: z.string().optional(),
})

// GET /api/courses?teacherId=&nivelMCER=&estado=
router.get('/', async (req, res) => {
  const q = validate(
    z.object({
      teacherId: z.coerce.number().int().optional(),
      nivelMCER: z.enum(['A1', 'A2', 'B1', 'B2', 'C1']).optional(),
      estado: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
    }),
    req.query,
  )

  const courses = await prisma.course.findMany({
    where: {
      ...(q.teacherId !== undefined ? { teacherId: q.teacherId } : {}),
      ...(q.nivelMCER ? { nivelMCER: q.nivelMCER } : {}),
      ...(q.estado ? { estado: q.estado } : {}),
    },
    include: {
      teacher: { select: { id: true, nombre: true } },
      _count: { select: { enrollments: true, modules: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ data: courses })
})

// POST /api/courses
router.post('/', async (req, res) => {
  const data = validate(createSchema, req.body)
  const course = await prisma.course.create({
    data: {
      titulo: data.titulo,
      nivelMCER: data.nivelMCER,
      descripcion: data.descripcion ?? null,
      modalidad: data.modalidad ?? 'ZOOM',
      estado: data.estado ?? 'DRAFT',
      teacherId: data.teacherId ?? req.user!.id,
      paqueteId: data.paqueteId ?? null,
    },
  })
  res.status(201).json({ data: course })
})

// GET /api/courses/:id
router.get('/:id', async (req, res) => {
  const { id } = validate(idParam, req.params)
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      teacher: { select: { id: true, nombre: true } },
      paquete: true,
      modules: { orderBy: { orden: 'asc' } },
      _count: { select: { enrollments: true, tasks: true, activities: true, resources: true } },
    },
  })
  if (!course) throw new AppError(404, 'NOT_FOUND', 'Curso no encontrado')
  res.json({ data: course })
})

// PATCH /api/courses/:id
router.patch('/:id', async (req, res) => {
  const { id } = validate(idParam, req.params)
  const data = validate(patchSchema, req.body)
  const existing = await prisma.course.findUnique({ where: { id } })
  if (!existing) throw new AppError(404, 'NOT_FOUND', 'Curso no encontrado')

  const course = await prisma.course.update({
    where: { id },
    data: {
      ...(data.titulo !== undefined ? { titulo: data.titulo } : {}),
      ...(data.nivelMCER !== undefined ? { nivelMCER: data.nivelMCER } : {}),
      ...(data.descripcion !== undefined ? { descripcion: data.descripcion } : {}),
      ...(data.modalidad !== undefined ? { modalidad: data.modalidad } : {}),
      ...(data.estado !== undefined ? { estado: data.estado } : {}),
      ...(data.teacherId !== undefined ? { teacherId: data.teacherId } : {}),
      ...(data.paqueteId !== undefined ? { paqueteId: data.paqueteId } : {}),
    },
  })
  res.json({ data: course })
})

// GET /api/courses/:id/modules
router.get('/:id/modules', async (req, res) => {
  const { id } = validate(idParam, req.params)
  const modules = await prisma.module.findMany({
    where: { courseId: id },
    orderBy: { orden: 'asc' },
  })
  res.json({ data: modules })
})

// POST /api/courses/:id/modules
router.post('/:id/modules', async (req, res) => {
  const { id } = validate(idParam, req.params)
  const data = validate(moduleSchema, req.body)
  const course = await prisma.course.findUnique({ where: { id } })
  if (!course) throw new AppError(404, 'NOT_FOUND', 'Curso no encontrado')

  const module = await prisma.module.create({
    data: {
      courseId: id,
      orden: data.orden,
      titulo: data.titulo,
      descripcion: data.descripcion ?? null,
      estado: data.estado ?? 'ACTIVE',
    },
  })
  res.status(201).json({ data: module })
})

export default router
