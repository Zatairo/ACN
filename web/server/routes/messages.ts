import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { validate } from '../lib/validate'
import { AppError } from '../lib/errors'
import { requireAuth } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

const idParam = z.object({ id: z.coerce.number().int().positive() })

const createSchema = z.object({
  destinatarioId: z.coerce.number().int().positive(),
  contenido: z.string().min(1, 'Contenido requerido'),
  tipo: z.enum(['MENSAJE', 'RECORDATORIO', 'ANUNCIO']).optional(),
})

// GET /api/messages/conversations — contactos con último mensaje y no leídos
router.get('/conversations', async (req, res) => {
  const userId = req.user!.id

  const messages = await prisma.message.findMany({
    where: { OR: [{ remitenteId: userId }, { destinatarioId: userId }] },
    select: { id: true, remitenteId: true, destinatarioId: true, contenido: true, leido: true, fecha: true },
    orderBy: { fecha: 'desc' },
  })

  const byOther = new Map<number, { ultimo: typeof messages[number]; noLeidos: number }>()
  for (const m of messages) {
    const other = m.remitenteId === userId ? m.destinatarioId : m.remitenteId
    const entry = byOther.get(other) ?? { ultimo: m, noLeidos: 0 }
    if (!byOther.has(other)) byOther.set(other, entry)
    if (m.destinatarioId === userId && !m.leido) entry.noLeidos += 1
  }

  const contactos = await prisma.user.findMany({
    where: { id: { in: [...byOther.keys()] } },
    select: { id: true, nombre: true, email: true, rol: true },
  })

  const conversations = contactos.map((c) => {
    const e = byOther.get(c.id)!
    return {
      contacto: { id: c.id, nombre: c.nombre, email: c.email, rol: c.rol },
      ultimoMensaje: { contenido: e.ultimo.contenido, fecha: e.ultimo.fecha, enviadoPorMi: e.ultimo.remitenteId === userId },
      noLeidos: e.noLeidos,
    }
  })
  conversations.sort((a, b) => String(b.ultimoMensaje.fecha).localeCompare(String(a.ultimoMensaje.fecha)))

  res.json({ data: conversations })
})

// GET /api/messages?with=userId — conversación entre el usuario y el otro
router.get('/', async (req, res) => {
  const q = validate(
    z.object({ with: z.coerce.number().int().positive() }),
    req.query,
  )

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { remitenteId: req.user!.id, destinatarioId: q.with },
        { remitenteId: q.with, destinatarioId: req.user!.id },
      ],
    },
    include: {
      remitente: { select: { id: true, nombre: true } },
      destinatario: { select: { id: true, nombre: true } },
    },
    orderBy: { fecha: 'asc' },
  })
  res.json({ data: messages })
})

// POST /api/messages
router.post('/', async (req, res) => {
  const data = validate(createSchema, req.body)

  if (data.destinatarioId === req.user!.id) {
    throw new AppError(400, 'SELF_MESSAGE', 'No puedes enviarte mensajes a ti mismo')
  }
  const destinatario = await prisma.user.findUnique({ where: { id: data.destinatarioId } })
  if (!destinatario) throw new AppError(404, 'NOT_FOUND', 'Destinatario no encontrado')

  const message = await prisma.message.create({
    data: {
      remitenteId: req.user!.id,
      destinatarioId: data.destinatarioId,
      contenido: data.contenido,
      tipo: data.tipo ?? 'MENSAJE',
    },
    include: {
      remitente: { select: { id: true, nombre: true } },
      destinatario: { select: { id: true, nombre: true } },
    },
  })
  res.status(201).json({ data: message })
})

// POST /api/messages/:id/read — solo el destinatario marca como leído
router.post('/:id/read', async (req, res) => {
  const { id } = validate(idParam, req.params)

  const message = await prisma.message.findUnique({ where: { id } })
  if (!message) throw new AppError(404, 'NOT_FOUND', 'Mensaje no encontrado')
  if (message.destinatarioId !== req.user!.id) {
    throw new AppError(403, 'FORBIDDEN', 'Solo el destinatario puede marcar el mensaje como leído')
  }

  const updated = await prisma.message.update({ where: { id }, data: { leido: true } })
  res.json({ data: updated })
})

export default router
