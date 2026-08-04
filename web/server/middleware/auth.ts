import type { NextFunction, Request, Response } from 'express'
import { verifyToken } from '../lib/jwt'
import { AppError } from '../lib/errors'

export interface AuthUser {
  id: number
  rol: 'STUDENT' | 'TEACHER' | 'ADMIN'
  estado: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

/** Exige token JWT válido y cuenta ACTIVA. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    next(new AppError(401, 'NO_TOKEN', 'Token no proporcionado'))
    return
  }
  try {
    const payload = verifyToken(header.slice(7))
    if (payload.estado !== 'ACTIVE') {
      next(new AppError(403, 'USER_INACTIVE', 'Cuenta inactiva o suspendida'))
      return
    }
    req.user = payload
    next()
  } catch {
    next(new AppError(401, 'INVALID_TOKEN', 'Token inválido o expirado'))
  }
}

/** Guarda por rol. ADMIN pasa las guardas de TEACHER (directora = admin + docente). */
export function requireRole(...roles: AuthUser['rol'][]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, 'NO_TOKEN', 'No autenticado'))
      return
    }
    const allowed =
      roles.includes(req.user.rol) || (req.user.rol === 'ADMIN' && roles.includes('TEACHER'))
    if (!allowed) {
      next(new AppError(403, 'FORBIDDEN', 'No tienes permiso para esta acción'))
      return
    }
    next()
  }
}
