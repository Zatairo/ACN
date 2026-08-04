import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { validate } from '../lib/validate'
import { AppError } from '../lib/errors'
import { requireAuth, requireRole } from '../middleware/auth'

const router = Router()

const idParam = z.object({ studentId: z.coerce.number().int().positive() })

const profileSchema = z.object({
  nivelMCER: z.enum(['A1', 'A2', 'B1', 'B2', 'C1']),
  proposito: z.string().optional().nullable(),
  industria: z.string().optional().nullable(),
  profesion: z.string().optional().nullable(),
  intereses: z.string().optional().nullable(),
  contextoProfesional: z.string().optional().nullable(),
  objetivo: z.string().optional().nullable(),
  horariosPreferidos: z.string().optional().nullable(),
  notasDocente: z.string().optional().nullable(),
  datosRAG: z.record(z.any()).optional().nullable(),
})

/** Resuelve el userId objetivo validando el permiso de lectura/escritura. */
async function resolveTarget(req: import('express').Request, studentId: number): Promise<number> {
  const user = req.user!
  if (user.rol === 'ADMIN' || user.rol === 'TEACHER') return studentId
  // STUDENT: solo su propio perfil
  if (user.id === studentId) return studentId
  throw new AppError(403, 'FORBIDDEN', 'Solo puedes ver o editar tu propio perfil')
}

// GET /api/students/:studentId/profile
router.get('/:studentId/profile', requireAuth, async (req, res) => {
  const { studentId } = validate(idParam, req.params)
  await resolveTarget(req, studentId)

  const profile = await prisma.studentProfile.findUnique({ where: { userId: studentId } })
  if (!profile) throw new AppError(404, 'PROFILE_NOT_FOUND', 'Perfil RAG no encontrado')
  res.json({ data: profile })
})

// PUT /api/students/:studentId/profile — crea o actualiza el perfil RAG
router.put('/:studentId/profile', requireAuth, requireRole('STUDENT', 'TEACHER'), async (req, res) => {
  const { studentId } = validate(idParam, req.params)
  await resolveTarget(req, studentId)
  const data = validate(profileSchema, req.body)

  const existing = await prisma.studentProfile.findUnique({ where: { userId: studentId } })
  const profile = existing
    ? await prisma.studentProfile.update({
        where: { userId: studentId },
        data,
      })
    : await prisma.studentProfile.create({ data: { userId: studentId, ...data } })

  res.json({ data: profile })
})

// POST /api/students/:studentId/level-test — registra el resultado del test de nivelación
router.post(
  '/:studentId/level-test',
  requireAuth,
  requireRole('STUDENT', 'TEACHER'),
  async (req, res) => {
    const { studentId } = validate(idParam, req.params)
    await resolveTarget(req, studentId)
    const data = validate(
      z.object({
        nivel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1']),
        respuestasJson: z.record(z.any()).optional(),
      }),
      req.body,
    )

    const profile = await prisma.studentProfile.upsert({
      where: { userId: studentId },
      create: { userId: studentId, nivelMCER: data.nivel },
      update: {
        nivelMCER: data.nivel,
        ...(data.respuestasJson ? { datosRAG: data.respuestasJson } : {}),
      },
    })
    res.json({ data: profile })
  },
)

export default router
