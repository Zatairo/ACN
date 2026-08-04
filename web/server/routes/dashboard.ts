import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'

// ─────────────────────────────────────────────────────────────
// Agregados de dashboard por rol (F2). Un solo endpoint según
// el rol del token: datos ya listos para las tarjetas de cada
// módulo (estudiante / profesor / admin).
// ─────────────────────────────────────────────────────────────

const router = Router()
router.use(requireAuth)

/** Mes actual en UTC (formato YYYY-MM) para reportes admin. */
const nowMonth = () => new Date().toISOString().slice(0, 7)

async function studentDashboard(userId: number) {
  const [profile, enrollments, tasks, sessions, payments] = await Promise.all([
    prisma.studentProfile.findUnique({ where: { userId } }),
    prisma.enrollment.findMany({
      where: { studentId: userId },
      include: { paquete: true, course: { select: { id: true, titulo: true, nivelMCER: true, teacherId: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.task.findMany({
      where: { studentId: userId },
      include: { grades: { select: { nota: true, feedback: true, fechaEvaluacion: true } }, submissions: { select: { id: true, fechaEntrega: true } } },
      orderBy: { fechaLimite: 'asc' },
    }),
    prisma.session.findMany({
      where: {
        enrollment: { studentId: userId },
        estado: { in: ['SCHEDULED', 'RESCHEDULED'] },
        fechaHora: { gte: new Date() },
      },
      include: { teacher: { select: { id: true, nombre: true } }, enrollment: { select: { id: true } } },
      orderBy: { fechaHora: 'asc' },
    }),
    prisma.payment.findMany({ where: { studentId: userId }, orderBy: { fecha: 'desc' }, take: 10 }),
  ])

  const matricula = enrollments[0] ?? null
  const sesionesRestantes = matricula
    ? Math.max(0, matricula.sesionesContratadas - matricula.sesionesUsadas)
    : 0

  const tareasPendientes = tasks
    .filter((t) => t.estado === 'ASSIGNED' || t.estado === 'SUBMITTED')
    .map((t) => ({
      id: t.id,
      titulo: t.titulo,
      tipo: t.tipo,
      estado: t.estado,
      fechaLimite: t.fechaLimite,
      tieneEntrega: t.submissions.length > 0,
    }))
  const tareasCalificadas = tasks.filter((t) => t.estado === 'GRADED')
  const promedioNota = tareasCalificadas.flatMap((t) => t.grades.map((g) => g.nota))

  const proximasClases = sessions.map((s) => ({
    id: s.id,
    fechaHora: s.fechaHora,
    estado: s.estado,
    enlaceVideo: s.enlaceVideo,
    tema: s.tema,
    docente: s.teacher.nombre,
  }))

  return {
    rol: 'STUDENT',
    perfil: profile ?? null,
    matricula: matricula
      ? {
          id: matricula.id,
          curso: matricula.course.titulo,
          nivelMCER: matricula.course.nivelMCER,
          paquete: matricula.paquete?.nombre ?? null,
          sesionesContratadas: matricula.sesionesContratadas,
          sesionesUsadas: matricula.sesionesUsadas,
          sesionesRestantes,
          estado: matricula.estado,
        }
      : null,
    proximaClase: proximasClases[0] ?? null,
    proximasClases,
    tareasPendientes,
    tareasPendientesCount: tareasPendientes.length,
    promedioNota: promedioNota.length
      ? Math.round((promedioNota.reduce((a, b) => a + b, 0) / promedioNota.length) * 100) / 100
      : null,
    pagosRecientes: payments.map((p) => ({
      id: p.id,
      concepto: p.concepto,
      valorCOP: p.valorCOP,
      estado: p.estado,
      metodo: p.metodo,
      fecha: p.fecha,
    })),
    // Contacto docente: la profesora del curso de su matrícula activa
    contactoDocente: matricula?.course?.teacherId
      ? await prisma.user.findUnique({
          where: { id: matricula.course.teacherId },
          select: { id: true, nombre: true, email: true, telefonoWhatsApp: true },
        })
      : null,
  }
}

async function teacherDashboard(teacherId: number) {
  const now = new Date()
  const [proximas, porCalificar, alertasPagos, estudiantes, tareasRecientes] = await Promise.all([
    prisma.session.findMany({
      where: { teacherId, estado: { in: ['SCHEDULED', 'RESCHEDULED'] }, fechaHora: { gte: now } },
      include: { enrollment: { select: { id: true, student: { select: { id: true, nombre: true } } } } },
      orderBy: { fechaHora: 'asc' },
      take: 10,
    }),
    prisma.task.findMany({
      where: { teacherId, estado: { in: ['SUBMITTED'] } },
      include: { student: { select: { id: true, nombre: true } }, submissions: true },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    }),
    prisma.payment.findMany({
      where: { estado: { in: ['PENDIENTE', 'VENCIDO'] } },
      include: { student: { select: { id: true, nombre: true } } },
      orderBy: { fecha: 'asc' },
      take: 10,
    }),
    prisma.user.findMany({
      where: { rol: 'STUDENT' },
      select: {
        id: true,
        nombre: true,
        studentProfile: { select: { nivelMCER: true } },
        enrollments: {
          where: { estado: 'ACTIVE' },
          select: { id: true, sesionesContratadas: true, sesionesUsadas: true },
        },
      },
      orderBy: { nombre: 'asc' },
    }),
    prisma.task.findMany({
      where: { teacherId },
      include: { student: { select: { id: true, nombre: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  return {
    rol: 'TEACHER',
    proximaClase: proximas[0] ?? null,
    proximasClases: proximas.map((s) => ({
      id: s.id,
      fechaHora: s.fechaHora,
      tema: s.tema,
      enlaceVideo: s.enlaceVideo,
      estudiante: s.enrollment.student.nombre,
    })),
    porCalificar: porCalificar.map((t) => ({
      id: t.id,
      titulo: t.titulo,
      estudiante: t.student.nombre,
      fechaEntrega: t.submissions[0]?.fechaEntrega ?? null,
    })),
    alertasPagos: alertasPagos.map((p) => ({
      id: p.id,
      concepto: p.concepto,
      valorCOP: p.valorCOP,
      estado: p.estado,
      estudiante: p.student.nombre,
    })),
    estudiantes: estudiantes.map((s) => ({
      id: s.id,
      nombre: s.nombre,
      nivelMCER: s.studentProfile?.nivelMCER ?? null,
      enrollmentId: s.enrollments[0]?.id ?? null,
      curso: s.enrollments[0] ? `${Math.max(0, s.enrollments[0].sesionesContratadas - s.enrollments[0].sesionesUsadas)} ses.` : null,
      sesionesRestantes: s.enrollments.length
        ? Math.max(0, s.enrollments[0].sesionesContratadas - s.enrollments[0].sesionesUsadas)
        : 0,
    })),
    tareasRecientes,
  }
}

async function adminDashboard() {
  const mes = nowMonth()
  const [ingresos, attendance, students, payments, leads, sessionsMes] = await Promise.all([
    prisma.payment.findMany({
      where: { estado: 'APROBADO', fecha: { gte: new Date(`${mes}-01`) } },
      select: { valorCOP: true },
    }),
    prisma.enrollment.findMany({
      include: {
        student: { select: { id: true, nombre: true } },
        sessions: { select: { estado: true, asistio: true } },
      },
    }),
    prisma.user.count({ where: { rol: 'STUDENT', estado: 'ACTIVE' } }),
    prisma.payment.findMany({
      where: { estado: { in: ['PENDIENTE', 'VENCIDO'] } },
      include: { student: { select: { id: true, nombre: true } } },
      orderBy: { fecha: 'asc' },
    }),
    prisma.lead.findMany({ select: { id: true, estado: true } }),
    prisma.session.findMany({
      where: { fechaHora: { gte: new Date(`${mes}-01`) } },
      select: { estado: true, asistio: true },
    }),
  ])

  const completadasMes = sessionsMes.filter((s) => s.estado === 'COMPLETED').length
  const asistioMes = sessionsMes.filter((s) => s.asistio === true).length
  const moraCOP = payments.filter((p) => p.estado === 'VENCIDO').reduce((a, p) => a + p.valorCOP, 0)

  return {
    rol: 'ADMIN',
    kpis: {
      estudiantesActivos: students,
      ingresosMesCOP: ingresos.reduce((a, p) => a + p.valorCOP, 0),
      ingresosMesCantidad: ingresos.length,
      moraCOP,
      pagosPendientes: payments.filter((p) => p.estado === 'PENDIENTE').length,
      pagosVencidos: payments.filter((p) => p.estado === 'VENCIDO').length,
      asistenciaMes: completadasMes > 0 ? Math.round((asistioMes / completadasMes) * 1000) / 10 : 0,
      clasesCompletadasMes: completadasMes,
      leadsNuevos: leads.filter((l) => l.estado === 'NUEVO').length,
      leadsCerrados: leads.filter((l) => l.estado === 'CERRADO').length,
    },
    asistenciaPorEstudiante: attendance.map((e) => ({
      estudiante: e.student.nombre,
      completadas: e.sessions.filter((s) => s.estado === 'COMPLETED').length,
      asistio: e.sessions.filter((s) => s.asistio === true).length,
    })),
    alertasPagos: payments.map((p) => ({
      id: p.id,
      concepto: p.concepto,
      valorCOP: p.valorCOP,
      estado: p.estado,
      estudiante: p.student.nombre,
    })),
  }
}

// GET /api/dashboard — agregado según el rol del usuario autenticado
router.get('/', async (req, res) => {
  if (req.user!.rol === 'STUDENT') {
    res.json({ data: await studentDashboard(req.user!.id) })
    return
  }
  if (req.user!.rol === 'TEACHER') {
    res.json({ data: await teacherDashboard(req.user!.id) })
    return
  }
  res.json({ data: await adminDashboard() })
})

export default router
