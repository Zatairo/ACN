import jwt from 'jsonwebtoken'

export interface TokenPayload {
  id: number
  rol: 'STUDENT' | 'TEACHER' | 'ADMIN'
  estado: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
}

const SECRET = process.env.JWT_SECRET ?? 'acn-institute-dev-secret'
const EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d'

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN } as jwt.SignOptions)
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, SECRET) as TokenPayload
}
