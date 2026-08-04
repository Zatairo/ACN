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
  studentId: z.coerce.number().int().positive().optional(),
  enrollmentId: z.coerce.number().int().positive().optional().nullable(),
  concepto: z.string().min(3, 'Concepto requerido'),
  valorCOP: z.coerce.number().int().min(1),
  metodo: z.enum(['NEQUI', 'DAVIVIENDA', 'WOMPI_CARD', 'WOMPI_NEQUI', 'WOMPI_PSE', 'EFECTIVO']),
  estado: z.enum(['PENDIENTE', 'APROBADO', 'RECHAZADO', 'REEMBOLSADO', 'VENCIDO']).optional(),
  referencia: z.string().optional().nullable(),
  comprobanteUrl: z.string().optional().nullable(),
})

const patchSchema = z.object({
  estado: z.enum(['PENDIENTE', 'APROBADO', 'RECHAZADO', 'REEMBOLSADO', 'VENCIDO']).optional(),
  referencia: z.string().optional().nullable(),
  comprobanteUrl: z.string().optional().nullable(),
})

// GET /api/payments?studentId=&estado=&metodo=
router.get('/', async (req, res) => {
  const q = validate(
    z.object({
      studentId: z.coerce.number().int().optional(),
      estado: z.enum(['PENDIENTE', 'APROBADO', 'RECHAZADO', 'REEMBOLSADO', 'VENCIDO']).optional(),
      metodo: z.enum(['NEQUI', 'DAVIVIENDA', 'WOMPI_CARD', 'WOMPI_NEQUI', 'WOMPI_PSE', 'EFECTIVO']).optional(),
    }),
    req.query,
  )

  const where: Record<string, unknown> = {}
  if (req.user!.rol === 'STUDENT') {
    where.studentId = req.user!.id
  } else {
    if (q.studentId !== undefined) where.studentId = q.studentId
  }
  if (q.estado) where.estado = q.estado
  if (q.metodo) where.metodo = q.metodo

  const payments = await prisma.payment.findMany({
    where,
    include: {
      student: { select: { id: true, nombre: true } },
      enrollment: { select: { id: true, course: { select: { id: true, titulo: true } } } },
    },
    orderBy: { fecha: 'desc' },
  })
  res.json({ data: payments })
})

// POST /api/payments — registro manual + comprobante (Nequi/Davivienda); Wompi en Fase 3
router.post('/', requireRole('STUDENT', 'ADMIN'), async (req, res) => {
  const data = validate(createSchema, req.body)

  const isAdmin = req.user!.rol === 'ADMIN'
  const studentId = isAdmin ? (data.studentId ?? req.user!.id) : req.user!.id
  if (!studentId) throw new AppError(400, 'STUDENT_REQUERIDO', 'Indica studentId')

  const student = await prisma.user.findUnique({ where: { id: studentId } })
  if (!student) throw new AppError(404, 'NOT_FOUND', 'Estudiante no encontrado')

  if (data.enrollmentId) {
    const enrollment = await prisma.enrollment.findUnique({ where: { id: data.enrollmentId } })
    if (!enrollment) throw new AppError(404, 'NOT_FOUND', 'Matrícula no encontrada')
    if (enrollment.studentId !== studentId) {
      throw new AppError(400, 'INVALID_ENROLLMENT', 'La matrícula no pertenece al estudiante')
    }
  }

  // For Wompi payments, we don't require a comprobante (it will be provided via webhook)
  // For other methods, we require comprobanteUrl (except EFECTIVO? but we keep as is)
  const isWompi = data.metodo.startsWith('WOMPI')
  if (!isWompi && !data.comprobanteUrl) {
    throw new AppError(400, 'COMPROBANTE_REQUERIDO', 'Se requiere comprobante para este método de pago')
  }

  const payment = await prisma.payment.create({
    data: {
      studentId,
      enrollmentId: data.enrollmentId ?? null,
      concepto: data.concepto,
      valorCOP: data.valorCOP,
      metodo: data.metodo,
      // El estudiante siempre entra como PENDIENTE; el admin puede fijar el estado final
      estado: isAdmin ? (data.estado ?? 'PENDIENTE') : 'PENDIENTE',
      referencia: data.referencia ?? null,
      comprobanteUrl: isWompi ? null : (data.comprobanteUrl ?? null), // For Wompi, we set null initially; webhook will update if needed
    },
  })
  if (isAdmin) await audit(req.user!.id, 'PAYMENT_CREATE', 'Payment', payment.id)
  res.status(201).json({ data: payment })
})

// PATCH /api/payments/:id — ADMIN aprueba/rechaza/reembolsa
router.patch('/:id', requireRole('ADMIN'), async (req, res) => {
  const { id } = validate(idParam, req.params)
  const data = validate(patchSchema, req.body)

  const existing = await prisma.payment.findUnique({ where: { id } })
  if (!existing) throw new AppError(404, 'NOT_FOUND', 'Pago no encontrado')

  const payment = await prisma.payment.update({
    where: { id },
    data: {
      ...(data.estado !== undefined ? { estado: data.estado } : {}),
      ...(data.referencia !== undefined ? { referencia: data.referencia } : {}),
      ...(data.comprobanteUrl !== undefined ? { comprobanteUrl: data.comprobanteUrl } : {}),
    },
  })
  await audit(
    req.user!.id,
    `PAYMENT_${data.estado ?? 'UPDATE'}`,
    'Payment',
    id,
  )
  res.json({ data: payment })
})

// POST /api/payments/wompi/webhook — Fase 3: recibe webhook de Wompi y actualiza el pago
// Por ahora, solo registramos el webhook y retornamos éxito.
// La implementación actualizada se hará en una futura iteración.
router.post('/wompi/webhook', async (req, res) => {
  // En una implementación real, verificar la firma del webhook usando WOMPI_SIGNATURE_KEY
  // y actualizar el pago correspondiente.
  console.log('Webhook de Wompi recibido:', req.body)
  res.json({ received: true })
})

export default router