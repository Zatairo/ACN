import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth'

const router = Router()
router.use(requireAuth, requireRole('ADMIN'))

// GET /api/integrations/status — estado de las integraciones externas
// Wompi, Calendly/Cal.com y ElevenLabs se activan en la Fase 3 del plan.
router.get('/status', (_req, res) => {
  res.json({
    data: {
      wompi: { configurado: false, fase: 3, estado: 'PENDIENTE', nota: 'Pagos manuales Nequi/Davivienda activos' },
      calendly: { configurado: false, fase: 3, estado: 'PENDIENTE', nota: 'Reserva nativa del LMS es el flujo principal' },
      elevenlabs: { configurado: false, fase: 3, estado: 'PENDIENTE', nota: 'src/lib/tts.js existe en el frontend' },
      whatsapp: { configurado: false, placeholder: 'wa.me/57', nota: 'Reemplazar por número real antes del lanzamiento (F5)' },
    },
  })
})

export default router
