import { prisma } from './prisma'

/** Trazabilidad admin: nunca lanza (el fallo de auditoría no rompe la operación). */
export async function audit(
  userId: number | null,
  accion: string,
  entidad: string,
  entidadId: string | number,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: { userId, accion, entidad, entidadId: String(entidadId) },
    })
  } catch (err) {
    console.error('[acn-lms-api] fallo al registrar AuditLog:', err)
  }
}
