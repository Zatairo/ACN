import 'dotenv/config'
import express from 'express'
import path from 'node:path'
import type { ErrorRequestHandler } from 'express'
import cors from 'cors'
import { Prisma } from '@prisma/client'
import { AppError } from './lib/errors'
import { prisma } from './lib/prisma'

import authRouter from './routes/auth'
import usersRouter from './routes/users'
import profilesRouter from './routes/profiles'
import coursesRouter from './routes/courses'
import enrollmentsRouter from './routes/enrollments'
import sessionsRouter from './routes/sessions'
import tasksRouter from './routes/tasks'
import packagesRouter from './routes/packages'
import paymentsRouter from './routes/payments'
import activitiesRouter from './routes/activities'
import resourcesRouter from './routes/resources'
import messagesRouter from './routes/messages'
import leadsRouter from './routes/leads'
import reportsRouter from './routes/reports'
import integrationsRouter from './routes/integrations'
import uploadsRouter from './routes/uploads'
import dashboardRouter from './routes/dashboard'
import notificationsRouter from './routes/notifications'

const app = express()

// Dev: refleja el origen (el frontend de Vite corre en :5173). En F5 se restringe a dominios propios.
app.use(cors({ origin: true }))
app.use(express.json({ limit: '2mb' }))

// Archivos subidos (comprobantes, entregas, materiales) — F2 uploads
app.use('/uploads', express.static(path.resolve(process.cwd(), 'server', 'uploads')))

// Health check — también verifica que la BD responde
app.get('/api/health', async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`
  res.json({
    data: {
      status: 'ok',
      service: 'acn-lms-api',
      version: '1.0.0',
      db: 'connected',
      time: new Date().toISOString(),
    },
  })
})

// ── Módulos (contrato REST del plan F1.D) ──────────────────
app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)
app.use('/api/students', profilesRouter)
app.use('/api/courses', coursesRouter)
app.use('/api/enrollments', enrollmentsRouter)
app.use('/api/sessions', sessionsRouter)
app.use('/api/tasks', tasksRouter)
app.use('/api/packages', packagesRouter)
app.use('/api/payments', paymentsRouter)
app.use('/api/activities', activitiesRouter)
app.use('/api/resources', resourcesRouter)
app.use('/api/messages', messagesRouter)
app.use('/api/leads', leadsRouter)
app.use('/api/reports', reportsRouter)
app.use('/api/integrations', integrationsRouter)
app.use('/api/upload', uploadsRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/notifications', notificationsRouter)

// 404 para rutas no definidas
app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ruta no encontrada' } })
})

// ── Manejo de errores centralizado ────────────────────────
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // JSON malformado
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: { code: 'BAD_JSON', message: 'Cuerpo JSON inválido' } })
    return
  }
  // Errores de la app
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
    })
    return
  }
  // Errores conocidos de Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: { code: 'CONFLICT', message: 'Ya existe un registro con esos datos únicos' } })
      return
    }
    if (err.code === 'P2025') {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Registro no encontrado' } })
      return
    }
    if (err.code === 'P2003') {
      res.status(400).json({ error: { code: 'FK_VIOLATION', message: 'Registro referenciado no existe o está en uso' } })
      return
    }
  }
  // Resto (500)
  console.error('[acn-lms-api] error no controlado:', err)
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Error interno del servidor' } })
}
app.use(errorHandler)

const PORT = Number(process.env.PORT ?? 4000)
app.listen(PORT, () => {
  console.log(`[acn-lms-api] escuchando en http://localhost:${PORT}`)
})
