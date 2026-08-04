import 'dotenv/config'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'

// DATABASE_URL viene de web/.env (cargado por dotenv y por Prisma Client).
// Fallback: ruta absoluta relativa al cwd (web/), p. ej. al correr npm run db:seed.
const url =
  process.env.DATABASE_URL ??
  `file:${path.join(process.cwd(), 'data', 'lms.db').replace(/\\/g, '/')}`

export const prisma = new PrismaClient({
  ...(url.startsWith('file:')
    ? { datasources: { db: { url } } }
    : {}),
})
