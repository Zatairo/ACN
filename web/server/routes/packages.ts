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

const patchSchema = z.object({
  nombre: z.string().min(3).optional(),
  sesiones: z.coerce.number().int().min(1).optional(),
  vigenciaDias: z.coerce.number().int().min(1).optional(),
  precioCOP: z.coerce.number().int().min(0).optional(),
  precioPorClase: z.coerce.number().min(0).optional(),
})

// GET /api/packages — visible para todos los autenticados
router.get('/', async (_req, res) => {
  const packages = await prisma.package.findMany({ orderBy: { precioCOP: 'asc' } })
  res.json({ data: packages })
})

// PATCH /api/packages/:id — ADMIN (precios: fuente única)
router.patch('/:id', requireRole('ADMIN'), async (req, res) => {
  const { id } = validate(idParam, req.params)
  const data = validate(patchSchema, req.body)

  const existing = await prisma.package.findUnique({ where: { id } })
  if (!existing) throw new AppError(404, 'NOT_FOUND', 'Paquete no encontrado')

  const sesiones = data.sesiones ?? existing.sesiones
  const precioCOP = data.precioCOP ?? existing.precioCOP
  const precioPorClase =
    data.precioPorClase ?? (sesiones > 0 ? Math.round((precioCOP / sesiones) * 100) / 100 : 0)

  const paquete = await prisma.package.update({
    where: { id },
    data: {
      ...(data.nombre !== undefined ? { nombre: data.nombre } : {}),
      ...(data.sesiones !== undefined ? { sesiones } : {}),
      ...(data.vigenciaDias !== undefined ? { vigenciaDias: data.vigenciaDias } : {}),
      ...(data.precioCOP !== undefined ? { precioCOP } : {}),
      precioPorClase,
    },
  })
  await audit(req.user!.id, 'PACKAGE_UPDATE', 'Package', id)
  res.json({ data: paquete })
})

export default router
