import type { ZodSchema } from 'zod'
import { AppError } from './errors'

/** Valida con zod y lanza AppError(400) con detalles planos si falla. */
export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Datos inválidos', result.error.flatten())
  }
  return result.data
}
