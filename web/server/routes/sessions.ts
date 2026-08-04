import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { validate } from '../lib/validate'
import { AppError } from '../lib/errors'
import { requireAuth, requireRole } from '../middleware/auth'
import { audit } from '../lib/audit'

const router = Router()
router.use(requireAuth)

const idParam = z.object({ id: z.coerce.number().int().positive() })

const createSchema = z.object({
  enrollmentId: z.coerce.number().int().positive(),
  fechaHora: z.coerce.date(),
  duracionMin: z.coerce.number().int().min(15).max(180).optional(),
  enlaceVideo: z.string().url().optional().nullable(),
  tema: z.string().optional().nullable(),
  notasClase: z.string().optional().nullable(),
  teacherId: z.coerce.number().int().optional(),
})

const patchSchema = z.object({
  fechaHora: z.coerce.date().optional(),
  duracionMin: z.coerce.number().int().min(15).max(180).optional(),
  enlaceVideo: z.string().url().optional().nullable(),
  tema: z.string().optional().nullable(),
  notasClase: z.string().optional().nullable(),
  asistio: z.boolean().optional(),
  estado: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW']).optional(),
  // Solicitud de reprogramación del estudiante (F2): solo reprogramacionFechaHora/Nota,
  // y únicamente sobre sesiones propias SCHEDULED/RESCHEDULED sin solicitud pendiente.
  reprogramacionFechaHora: z.coerce.date().optional().nullable(),
  reprogramacionNota: z.string().optional().nullable(),
  // TEACHER/ADMIN: aprobar la solicitud pendiente aplicando reprogramacionFechaHora
  aprobarReprogramacion: z.boolean().optional(),
})

/** Enrollments que el usuario puede ver/crear sesiones. */
async function visibleEnrollmentIds(user: { id: number; rol: string }): Promise<number[]> {
  if (user.rol === 'ADMIN') return [] // sin filtro
  const enrollments = await prisma.enrollment.findMany({
    where: user.rol === 'TEACHER' ? undefined : { studentId: user.id },
    select: { id: true },
  })
  return enrollments.map((e) => e.id)
}

// GET /api/sessions?from=&to=&studentId=&estado=
router.get('/', async (req, res) => {
  const q = validate(
    z.object({
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional(),
      studentId: z.coerce.number().int().optional(),
      estado: z
        .enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW'])
        .optional(),
    }),
    req.query,
  )

  const where: Record<string, unknown> = {}
  if (q.from || q.to) {
    where.fechaHora = { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lte: q.to } : {}) }
  }
  if (q.estado) where.estado = q.estado

  // Filtros de alcance por rol
  if (req.user!.rol === 'STUDENT') {
    const ids = await visibleEnrollmentIds(req.user!)
    if (ids.length === 0) return res.json({ data: [] })
    where.enrollmentId = { in: ids }
  } else if (req.user!.rol === 'TEACHER') {
    where.teacherId = req.user!.id
  } else if (q.studentId !== undefined) {
    const ids = await visibleEnrollmentIds({ id: q.studentId, rol: 'STUDENT' })
    where.enrollmentId = { in: ids }
  }

  const sessions = await prisma.session.findMany({
    where,
    include: {
      enrollment: { select: { id: true, student: { select: { id: true, nombre: true } } } },
      teacher: { select: { id: true, nombre: true } },
    },
    orderBy: { fechaHora: 'asc' },
  })
  res.json({ data: sessions })
})

// POST /api/sessions — TEACHER/ADMIN crean (PROFESORA); STUDENT puede solicitar (ESTUDIANTE)
router.post('/', requireRole('STUDENT', 'TEACHER'), async (req, res) => {
  const data = validate(createSchema, req.body)

  const enrollment = await prisma.enrollment.findUnique({ where: { id: data.enrollmentId } })
  if (!enrollment) throw new AppError(404, 'NOT_FOUND', 'Matrícula no encontrada')

  if (req.user!.rol === 'STUDENT' && enrollment.studentId !== req.user!.id) {
    throw new AppError(403, 'FORBIDDEN', 'Solo puedes crear sesiones en tus matrículas')
  }

  const session = await prisma.session.create({
    data: {
      enrollmentId: data.enrollmentId,
      teacherId: data.teacherId ?? req.user!.id,
      fechaHora: data.fechaHora,
      duracionMin: data.duracionMin ?? 45,
      enlaceVideo: data.enlaceVideo ?? null,
      tema: data.tema ?? null,
      notasClase: data.notasClase ?? null,
      creadaPor: req.user!.rol === 'STUDENT' ? 'ESTUDIANTE' : 'PROFESORA',
      estado: 'SCHEDULED',
    },
    include: {
      enrollment: { select: { id: true, student: { select: { id: true, nombre: true } } } },
    },
  })
  res.status(201).json({ data: session })
})

// GET /api/sessions/:id — detalle con permisos de alcance por rol
router.get('/:id', async (req, res) => {
  const { id } = validate(idParam, req.params)

  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      enrollment: {
        select: {
          id: true,
          student: { select: { id: true, nombre: true } },
          course: { select: { id: true, titulo: true } },
        },
      },
      teacher: { select: { id: true, nombre: true } },
    },
  })
  if (!session) throw new AppError(404, 'NOT_FOUND', 'Sesión no encontrada')

  if (req.user!.rol === 'STUDENT' && session.enrollment.student.id !== req.user!.id) {
    throw new AppError(403, 'FORBIDDEN', 'No puedes ver esta sesión')
  }
  if (req.user!.rol === 'TEACHER' && session.teacherId !== req.user!.id) {
    throw new AppError(403, 'FORBIDDEN', 'No puedes ver esta sesión')
  }

  res.json({ data: session })
})

// PATCH /api/sessions/:id — asistencia, enlace, reprogramación, notas.
// - TEACHER/ADMIN: control total (incluye aprobar solicitudes de reprogramación).
// - STUDENT: solo puede SOLICITAR reprogramación (su enrollment + SCHEDULED/RESCHEDULED
//   + sin solicitud pendiente); queda en estado "pendiente de aprobación" marcado en
//   reprogramacionSolicitada=true hasta que la profesora la apruebe.
router.patch('/:id', async (req, res) => {
  const { id } = validate(idParam, req.params)
  const data = validate(patchSchema, req.body)

  const existing = await prisma.session.findUnique({
    where: { id },
    include: { enrollment: { select: { studentId: true } } },
  })
  if (!existing) throw new AppError(404, 'NOT_FOUND', 'Sesión no encontrada')

  const esDocente = req.user!.rol === 'TEACHER' || req.user!.rol === 'ADMIN'

  if (!esDocente) {
    // ── STUDENT: solicitud de reprogramación ──
    if (existing.enrollment.studentId !== req.user!.id) {
      throw new AppError(403, 'FORBIDDEN', 'Solo puedes solicitar reprogramación de tus sesiones')
    }
    if (existing.estado !== 'SCHEDULED' && existing.estado !== 'RESCHEDULED') {
      throw new AppError(409, 'SESSION_NOT_RESCHEDULABLE', 'Solo se reprograman sesiones programadas')
    }
    if (existing.reprogramacionSolicitada) {
      throw new AppError(409, 'ALREADY_REQUESTED', 'Ya hay una solicitud de reprogramación pendiente')
    }
    const nuevaFecha = data.reprogramacionFechaHora ?? data.fechaHora
    if (!nuevaFecha) {
      throw new AppError(400, 'FECHA_REQUERIDA', 'Indica reprogramacionFechaHora para solicitar el cambio')
    }
    const session = await prisma.session.update({
      where: { id },
      data: {
        reprogramacionSolicitada: true,
        reprogramacionFechaHora: nuevaFecha,
        reprogramacionNota: data.reprogramacionNota ?? null,
      },
    })
    await audit(req.user!.id, 'SESSION_RESCHEDULE_REQUEST', 'Session', id)
    res.json({ data: session })
    return
  }

  // ── TEACHER/ADMIN: edición completa + aprobación de solicitud ──
  const dataPatch: Record<string, unknown> = {}
  if (data.fechaHora !== undefined) dataPatch.fechaHora = data.fechaHora
  if (data.duracionMin !== undefined) dataPatch.duracionMin = data.duracionMin
  if (data.enlaceVideo !== undefined) dataPatch.enlaceVideo = data.enlaceVideo
  if (data.tema !== undefined) dataPatch.tema = data.tema
  if (data.notasClase !== undefined) dataPatch.notasClase = data.notasClase
  if (data.asistio !== undefined) dataPatch.asistio = data.asistio
  if (data.estado !== undefined) dataPatch.estado = data.estado

  // Aprobar solicitud pendiente: aplica la fecha solicitada y marca RESCHEDULED
  if (existing.reprogramacionSolicitada && (data.aprobarReprogramacion || data.fechaHora)) {
    dataPatch.fechaHora = data.fechaHora ?? existing.reprogramacionFechaHora
    if (dataPatch.fechaHora === null || dataPatch.fechaHora === undefined) {
      throw new AppError(400, 'FECHA_REQUERIDA', 'La solicitud no tiene fecha válida para aprobar')
    }
    dataPatch.estado = 'RESCHEDULED'
    dataPatch.reprogramacionSolicitada = false
    dataPatch.reprogramacionFechaHora = null
    dataPatch.reprogramacionNota = null
    if (existing.estado !== 'RESCHEDULED') {
      await audit(req.user!.id, 'SESSION_RESCHEDULE_APPROVED', 'Session', id)
    }
  }

  const session = await prisma.session.update({ where: { id }, data: dataPatch })
  res.json({ data: session })
})

// POST /api/sessions/:id/cancel — TEACHER/ADMIN o el estudiante dueño de la matrícula
router.post('/:id/cancel', async (req, res) => {
  const { id } = validate(idParam, req.params)

  const session = await prisma.session.findUnique({
    where: { id },
    include: { enrollment: { select: { studentId: true } } },
  })
  if (!session) throw new AppError(404, 'NOT_FOUND', 'Sesión no encontrada')

  if (
    req.user!.rol === 'STUDENT' &&
    session.enrollment.studentId !== req.user!.id
  ) {
    throw new AppError(403, 'FORBIDDEN', 'No puedes cancelar esta sesión')
  }

  const updated = await prisma.session.update({
    where: { id },
    data: { estado: 'CANCELLED' },
  })
  await audit(req.user!.id, 'SESSION_CANCEL', 'Session', id)
  res.json({ data: updated })
})

export default router
