import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { signToken } from '../lib/jwt'
import { validate } from '../lib/validate'
import { AppError } from '../lib/errors'
import { requireAuth } from '../middleware/auth'
import { audit } from '../lib/audit'

const router = Router()

const publicUser = {
  id: true,
  email: true,
  nombre: true,
  telefonoWhatsApp: true,
  rol: true,
  estado: true,
  createdAt: true,
}

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  nombre: z.string().min(2, 'Nombre requerido'),
  telefonoWhatsApp: z.string().optional(),
  rol: z.enum(['STUDENT', 'TEACHER', 'ADMIN']).optional(),
})

// POST /api/auth/register — público (crea STUDENT salvo que un ADMIN lo invoque con rol)
router.post('/register', async (req, res) => {
  const data = validate(registerSchema, req.body)
  const rol = data.rol && req.user?.rol === 'ADMIN' ? data.rol : 'STUDENT'

  const existing = await prisma.user.findUnique({ where: { email: data.email } })
  if (existing) throw new AppError(409, 'EMAIL_IN_USE', 'El email ya está registrado')

  const passwordHash = await bcrypt.hash(data.password, 10)
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      nombre: data.nombre,
      telefonoWhatsApp: data.telefonoWhatsApp ?? null,
      rol,
      estado: 'ACTIVE',
    },
    select: publicUser,
  })
  await audit(req.user?.id ?? null, 'REGISTER', 'User', user.id)

  const token = signToken({ id: user.id, rol: user.rol, estado: user.estado })
  res.status(201).json({ data: { token, user } })
})

// POST /api/auth/login — público
router.post('/login', async (req, res) => {
  const data = validate(z.object({ email: z.string().email(), password: z.string() }), req.body)

  const user = await prisma.user.findUnique({ where: { email: data.email } })
  if (!user) throw new AppError(401, 'BAD_CREDENTIALS', 'Credenciales inválidas')

  const ok = await bcrypt.compare(data.password, user.passwordHash)
  if (!ok) throw new AppError(401, 'BAD_CREDENTIALS', 'Credenciales inválidas')

  if (user.estado !== 'ACTIVE') {
    throw new AppError(
      403,
      'USER_INACTIVE',
      'Cuenta inactiva (DEMO/histórica) o suspendida — no puede iniciar sesión',
    )
  }

  const token = signToken({ id: user.id, rol: user.rol, estado: user.estado })
  res.json({
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        telefonoWhatsApp: user.telefonoWhatsApp,
        rol: user.rol,
        estado: user.estado,
      },
    },
  })
})

// POST /api/auth/logout — JWT stateless: el cliente descarta el token
router.post('/logout', requireAuth, (_req, res) => {
  res.json({ data: { message: 'Sesión cerrada' } })
})

// GET /api/auth/me — perfil + StudentProfile del usuario autenticado
router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { ...publicUser, studentProfile: true },
  })
  if (!user) throw new AppError(404, 'NOT_FOUND', 'Usuario no encontrado')
  res.json({ data: user })
})

// POST /api/auth/reset-password — autenticado; verifica la contraseña actual
router.post('/reset-password', requireAuth, async (req, res) => {
  const data = validate(
    z.object({
      passwordActual: z.string().min(1),
      nuevaPassword: z.string().min(8, 'Mínimo 8 caracteres'),
    }),
    req.body,
  )

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
  if (!user) throw new AppError(404, 'NOT_FOUND', 'Usuario no encontrado')

  const ok = await bcrypt.compare(data.passwordActual, user.passwordHash)
  if (!ok) throw new AppError(401, 'BAD_CREDENTIALS', 'Contraseña actual incorrecta')

  const passwordHash = await bcrypt.hash(data.nuevaPassword, 10)
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })
  await audit(user.id, 'RESET_PASSWORD', 'User', user.id)

  res.json({ data: { message: 'Contraseña actualizada' } })
})

export default router
