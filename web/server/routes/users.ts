import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { validate } from '../lib/validate'
import { AppError } from '../lib/errors'
import { requireAuth, requireRole } from '../middleware/auth'
import { audit } from '../lib/audit'

const router = Router()
router.use(requireAuth, requireRole('ADMIN'))

const idParam = z.object({ id: z.coerce.number().int().positive() })

const createSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  nombre: z.string().min(2, 'Nombre requerido'),
  telefonoWhatsApp: z.string().optional(),
  rol: z.enum(['STUDENT', 'TEACHER', 'ADMIN']),
  estado: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
})

const patchSchema = z.object({
  email: z.string().email('Email inválido').optional(),
  password: z.string().min(8, 'Mínimo 8 caracteres').optional(),
  nombre: z.string().min(2).optional(),
  telefonoWhatsApp: z.string().optional().nullable(),
  rol: z.enum(['STUDENT', 'TEACHER', 'ADMIN']).optional(),
  estado: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
})

// GET /api/users?rol=&estado=&search=
router.get('/', async (req, res) => {
  const data = validate(
    z.object({
      rol: z.enum(['STUDENT', 'TEACHER', 'ADMIN']).optional(),
      estado: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
      search: z.string().optional(),
    }),
    req.query,
  )

  const users = await prisma.user.findMany({
    where: {
      ...(data.rol ? { rol: data.rol } : {}),
      ...(data.estado ? { estado: data.estado } : {}),
      ...(data.search
        ? { OR: [{ nombre: { contains: data.search } }, { email: { contains: data.search } }] }
        : {}),
    },
    select: {
      id: true,
      email: true,
      nombre: true,
      telefonoWhatsApp: true,
      rol: true,
      estado: true,
      createdAt: true,
      studentProfile: { select: { nivelMCER: true, industria: true } },
    },
    orderBy: { createdAt: 'asc' },
  })
  res.json({ data: users })
})

// POST /api/users
router.post('/', async (req, res) => {
  const data = validate(createSchema, req.body)
  const existing = await prisma.user.findUnique({ where: { email: data.email } })
  if (existing) throw new AppError(409, 'EMAIL_IN_USE', 'El email ya está registrado')

  const passwordHash = await bcrypt.hash(data.password, 10)
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      nombre: data.nombre,
      telefonoWhatsApp: data.telefonoWhatsApp ?? null,
      rol: data.rol,
      estado: data.estado ?? 'ACTIVE',
    },
    select: { id: true, email: true, nombre: true, rol: true, estado: true },
  })
  await audit(req.user!.id, 'USER_CREATE', 'User', user.id)
  res.status(201).json({ data: user })
})

// PATCH /api/users/:id — editar perfil, rol, estado o resetear contraseña
router.patch('/:id', async (req, res) => {
  const { id } = validate(idParam, req.params)
  const data = validate(patchSchema, req.body)

  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) throw new AppError(404, 'NOT_FOUND', 'Usuario no encontrado')

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(data.email !== undefined ? { email: data.email } : {}),
      ...(data.nombre !== undefined ? { nombre: data.nombre } : {}),
      ...(data.telefonoWhatsApp !== undefined ? { telefonoWhatsApp: data.telefonoWhatsApp } : {}),
      ...(data.rol !== undefined ? { rol: data.rol } : {}),
      ...(data.estado !== undefined ? { estado: data.estado } : {}),
      ...(data.password ? { passwordHash: await bcrypt.hash(data.password, 10) } : {}),
    },
    select: { id: true, email: true, nombre: true, rol: true, estado: true },
  })
  await audit(req.user!.id, 'USER_UPDATE', 'User', id)
  res.json({ data: user })
})

// DELETE /api/users/:id — borrado lógico: suspende la cuenta (conserva trazabilidad y FKs)
router.delete('/:id', async (req, res) => {
  const { id } = validate(idParam, req.params)
  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) throw new AppError(404, 'NOT_FOUND', 'Usuario no encontrado')

  const user = await prisma.user.update({
    where: { id },
    data: { estado: 'SUSPENDED' },
    select: { id: true, email: true, nombre: true, rol: true, estado: true },
  })
  await audit(req.user!.id, 'USER_DELETE', 'User', id)
  res.json({ data: { deleted: true, user } })
})

export default router
