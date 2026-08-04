import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'

// ─────────────────────────────────────────────────────────────
// Notificaciones in-app (F2.A3): mensajes no leídos y
// recordatorios de clase próxima. Endpoint ligero para polling
// del layout autenticado (refetch cada 60 s desde el frontend).
// ─────────────────────────────────────────────────────────────

const router = Router()
router.use(requireAuth)

// GET /api/notifications — mensajes no leídos + próximas clases
router.get('/', async (req, res) => {
  const userId = req.user!.id

  const [noLeidos, proximas] = await Promise.all([
    prisma.message.findMany({
      where: { destinatarioId: userId, leido: false },
      select: { id: true, remitenteId: true, contenido: true, tipo: true, fecha: true },
      orderBy: { fecha: 'desc' },
      take: 20,
    }),
    prisma.session.findMany({
      where:
        req.user!.rol === 'STUDENT'
          ? { enrollment: { studentId: userId }, fechaHora: { gte: new Date() } }
          : req.user!.rol === 'TEACHER'
            ? { teacherId: userId, fechaHora: { gte: new Date() } }
            : { fechaHora: { gte: new Date() } },
      select: {
        id: true,
        fechaHora: true,
        tema: true,
        estado: true,
        enrollment: { select: { student: { select: { id: true, nombre: true } } } },
      },
      orderBy: { fechaHora: 'asc' },
      take: 5,
    }),
  ])

  // Remitentes para mostrar nombre (los mensajes no incluyen join)
  const remitentes = noLeidos.length
    ? await prisma.user.findMany({
        where: { id: { in: [...new Set(noLeidos.map((m) => m.remitenteId))] } },
        select: { id: true, nombre: true },
      })
    : []
  const nombreDe = new Map(remitentes.map((r) => [r.id, r.nombre]))

  res.json({
    data: {
      mensajesNoLeidos: noLeidos.map((m) => ({
        id: m.id,
        remitenteId: m.remitenteId,
        remitente: nombreDe.get(m.remitenteId) ?? 'Usuario',
        contenido: m.contenido,
        tipo: m.tipo,
        fecha: m.fecha,
      })),
      proximasClases: proximas.map((s) => ({
        id: s.id,
        fechaHora: s.fechaHora,
        tema: s.tema,
        estado: s.estado,
        estudiante: s.enrollment.student.nombre,
      })),
      totalNoLeidos: noLeidos.length,
    },
  })
})

// POST /api/notifications/read-all — marca todos los mensajes recibidos como leídos
router.post('/read-all', async (req, res) => {
  const result = await prisma.message.updateMany({
    where: { destinatarioId: req.user!.id, leido: false },
    data: { leido: true },
  })
  res.json({ data: { marcados: result.count } })
})

export default router
