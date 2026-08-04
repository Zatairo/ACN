import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { validate } from '../lib/validate'
import { requireAuth, requireRole } from '../middleware/auth'

const router = Router()
router.use(requireAuth, requireRole('ADMIN'))

// GET /api/reports/income?desde=&hasta= — ingresos aprobados por mes y método
router.get('/income', async (req, res) => {
  const q = validate(
    z.object({
      desde: z.coerce.date().optional(),
      hasta: z.coerce.date().optional(),
    }),
    req.query,
  )

  const payments = await prisma.payment.findMany({
    where: {
      estado: 'APROBADO',
      ...(q.desde || q.hasta
        ? { fecha: { ...(q.desde ? { gte: q.desde } : {}), ...(q.hasta ? { lte: q.hasta } : {}) } }
        : {}),
    },
    select: { valorCOP: true, metodo: true, fecha: true, concepto: true, studentId: true },
  })

  const porMes: Record<string, { mes: string; totalCOP: number; cantidad: number }> = {}
  const porMetodo: Record<string, { metodo: string; totalCOP: number; cantidad: number }> = {}

  let totalCOP = 0
  for (const p of payments) {
    totalCOP += p.valorCOP
    const mes = p.fecha.toISOString().slice(0, 7)
    porMes[mes] ??= { mes, totalCOP: 0, cantidad: 0 }
    porMes[mes].totalCOP += p.valorCOP
    porMes[mes].cantidad += 1

    porMetodo[p.metodo] ??= { metodo: p.metodo, totalCOP: 0, cantidad: 0 }
    porMetodo[p.metodo].totalCOP += p.valorCOP
    porMetodo[p.metodo].cantidad += 1
  }

  res.json({
    data: {
      totalCOP,
      cantidad: payments.length,
      porMes: Object.values(porMes).sort((a, b) => a.mes.localeCompare(b.mes)),
      porMetodo: Object.values(porMetodo).sort((a, b) => b.totalCOP - a.totalCOP),
    },
  })
})

// GET /api/reports/income/export — CSV descargable (F2.D5 finanzas)
router.get('/income/export', async (req, res) => {
  const q = validate(
    z.object({
      desde: z.coerce.date().optional(),
      hasta: z.coerce.date().optional(),
    }),
    req.query,
  )

  const payments = await prisma.payment.findMany({
    where: {
      estado: 'APROBADO',
      ...(q.desde || q.hasta
        ? { fecha: { ...(q.desde ? { gte: q.desde } : {}), ...(q.hasta ? { lte: q.hasta } : {}) } }
        : {}),
    },
    include: { student: { select: { nombre: true } } },
    orderBy: { fecha: 'asc' },
  })

  const esc = (v: unknown) => {
    const s = String(v ?? '')
    return `"${s.replace(/"/g, '""')}"`
  }
  const lines = [
    ['fecha', 'estudiante', 'concepto', 'metodo', 'valorCOP', 'referencia', 'transaccionIdWompi']
      .map((h) => esc(h))
      .join(','),
    ...payments.map((p) =>
      [
        p.fecha.toISOString(),
        p.student.nombre,
        p.concepto,
        p.metodo,
        p.valorCOP,
        p.referencia,
        p.transaccionIdWompi,
      ]
        .map(esc)
        .join(','),
    ),
  ]

  const total = payments.reduce((a, p) => a + p.valorCOP, 0)
  lines.push(esc('TOTAL') + ',' + esc('') + ',' + esc('') + ',' + esc('') + ',' + esc(total))

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="ingresos-acn-${new Date().toISOString().slice(0, 10)}.csv"`,
  )
  res.send('\uFEFF' + lines.join('\r\n')) // BOM para Excel
})

// GET /api/reports/attendance — asistencia por matrícula/estudiante
router.get('/attendance', async (_req, res) => {
  const enrollments = await prisma.enrollment.findMany({
    include: {
      student: { select: { id: true, nombre: true } },
      course: { select: { id: true, titulo: true, nivelMCER: true } },
      sessions: { select: { estado: true, asistio: true } },
    },
  })

  const data = enrollments.map((e) => {
    const total = e.sessions.length
    const completadas = e.sessions.filter((s) => s.estado === 'COMPLETED').length
    const noShow = e.sessions.filter((s) => s.estado === 'NO_SHOW').length
    const canceladas = e.sessions.filter((s) => s.estado === 'CANCELLED').length
    const asistio = e.sessions.filter((s) => s.asistio === true).length
    const asistenciaPct = completadas > 0 ? Math.round((asistio / completadas) * 1000) / 10 : 0
    return {
      enrollmentId: e.id,
      estudiante: e.student.nombre,
      curso: e.course.titulo,
      nivelMCER: e.course.nivelMCER,
      totalSesiones: total,
      completadas,
      asistio,
      noShow,
      canceladas,
      asistenciaPct,
    }
  })

  res.json({ data })
})

// GET /api/reports/progress — progreso académico por estudiante
router.get('/progress', async (_req, res) => {
  const students = await prisma.user.findMany({
    where: { rol: 'STUDENT' },
    select: {
      id: true,
      nombre: true,
      studentProfile: { select: { nivelMCER: true } },
      tasksForStudent: {
        select: {
          id: true,
          estado: true,
          grades: { select: { nota: true } },
        },
      },
      submissions: { select: { id: true } },
      practiceAttempts: { select: { id: true, puntaje: true } },
      enrollments: {
        select: {
          id: true,
          sesionesContratadas: true,
          sesionesUsadas: true,
          sessions: { select: { estado: true } },
        },
      },
    },
    orderBy: { nombre: 'asc' },
  })

  const data = students.map((s) => {
    const tareas = s.tasksForStudent.length
    const calificadas = s.tasksForStudent.filter((t) => t.estado === 'GRADED').length
    const notas = s.tasksForStudent.flatMap((t) => t.grades.map((g) => g.nota))
    const promedioNota = notas.length
      ? Math.round((notas.reduce((a, b) => a + b, 0) / notas.length) * 100) / 100
      : null
    const sesionesCompletadas = s.enrollments.reduce(
      (acc, e) => acc + e.sessions.filter((x) => x.estado === 'COMPLETED').length,
      0,
    )
    return {
      estudianteId: s.id,
      nombre: s.nombre,
      nivelMCER: s.studentProfile?.nivelMCER ?? null,
      tareasAsignadas: tareas,
      tareasCalificadas: calificadas,
      promedioNota,
      entregas: s.submissions.length,
      intentosPractica: s.practiceAttempts.length,
      promedioPractica: s.practiceAttempts.length
        ? Math.round(
            (s.practiceAttempts.filter((a) => a.puntaje !== null).reduce((acc, a) => acc + (a.puntaje ?? 0), 0) /
              s.practiceAttempts.filter((a) => a.puntaje !== null).length) *
              100,
          ) / 100
        : null,
      sesionesCompletadas,
      matricula: s.enrollments.map((e) => ({
        id: e.id,
        sesionesContratadas: e.sesionesContratadas,
        sesionesUsadas: e.sesionesUsadas,
      })),
    }
  })

  res.json({ data })
})

export default router
