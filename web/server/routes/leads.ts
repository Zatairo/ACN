import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { validate } from '../lib/validate'
import { AppError } from '../lib/errors'
import { requireAuth, requireRole } from '../middleware/auth'

// CRM: sin rol VENTAS en F1 → lo gestiona el ADMIN (el rol VENTAS se suma en F2 si hace falta)
const router = Router()
router.use(requireAuth, requireRole('ADMIN'))

const idParam = z.object({ id: z.coerce.number().int().positive() })

const createSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  telefonoWhatsApp: z.string().optional().nullable(),
  canal: z.enum(['WEB', 'IG', 'TIKTOK', 'FOLLETO', 'REFERIDO']),
  estado: z.enum(['NUEVO', 'CONTACTADO', 'DIAGNOSTICO', 'OFERTA', 'CERRADO', 'PERDIDO']).optional(),
  nivelEstimado: z.enum(['A1', 'A2', 'B1', 'B2', 'C1']).optional().nullable(),
  notas: z.string().optional().nullable(),
})

const patchSchema = z.object({
  nombre: z.string().min(2).optional(),
  telefonoWhatsApp: z.string().optional().nullable(),
  canal: z.enum(['WEB', 'IG', 'TIKTOK', 'FOLLETO', 'REFERIDO']).optional(),
  estado: z.enum(['NUEVO', 'CONTACTADO', 'DIAGNOSTICO', 'OFERTA', 'CERRADO', 'PERDIDO']).optional(),
  nivelEstimado: z.enum(['A1', 'A2', 'B1', 'B2', 'C1']).optional().nullable(),
  notas: z.string().optional().nullable(),
})

// GET /api/leads?estado=&canal=
router.get('/', async (req, res) => {
  const q = validate(
    z.object({
      estado: z.enum(['NUEVO', 'CONTACTADO', 'DIAGNOSTICO', 'OFERTA', 'CERRADO', 'PERDIDO']).optional(),
      canal: z.enum(['WEB', 'IG', 'TIKTOK', 'FOLLETO', 'REFERIDO']).optional(),
    }),
    req.query,
  )

  const leads = await prisma.lead.findMany({
    where: {
      ...(q.estado ? { estado: q.estado } : {}),
      ...(q.canal ? { canal: q.canal } : {}),
    },
    orderBy: { fecha: 'desc' },
  })
  res.json({ data: leads })
})

// POST /api/leads
router.post('/', async (req, res) => {
  const data = validate(createSchema, req.body)
  const lead = await prisma.lead.create({
    data: {
      nombre: data.nombre,
      telefonoWhatsApp: data.telefonoWhatsApp ?? null,
      canal: data.canal,
      estado: data.estado ?? 'NUEVO',
      nivelEstimado: data.nivelEstimado ?? null,
      notas: data.notas ?? null,
    },
  })
  res.status(201).json({ data: lead })
})

// PATCH /api/leads/:id — mover por el funnel (NUEVO → CERRADO)
router.patch('/:id', async (req, res) => {
  const { id } = validate(idParam, req.params)
  const data = validate(patchSchema, req.body)

  const existing = await prisma.lead.findUnique({ where: { id } })
  if (!existing) throw new AppError(404, 'NOT_FOUND', 'Lead no encontrado')

  const lead = await prisma.lead.update({
    where: { id },
    data: {
      ...(data.nombre !== undefined ? { nombre: data.nombre } : {}),
      ...(data.telefonoWhatsApp !== undefined ? { telefonoWhatsApp: data.telefonoWhatsApp } : {}),
      ...(data.canal !== undefined ? { canal: data.canal } : {}),
      ...(data.estado !== undefined ? { estado: data.estado } : {}),
      ...(data.nivelEstimado !== undefined ? { nivelEstimado: data.nivelEstimado } : {}),
      ...(data.notas !== undefined ? { notas: data.notas } : {}),
    },
  })
  res.json({ data: lead })
})

export default router
