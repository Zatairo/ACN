import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ClipboardList, GraduationCap, CreditCard, Video, MessageCircle, ArrowRight, TrendingUp } from 'lucide-react';
import { dashboardApi } from '@/api/lmsClient';
import { LmsPage, StatCard, NivelBadge, EstadoBadge, Spinner, EmptyState } from '@/components/lms/common';
import { formatFechaHora, formatCOP, etiqueta, PAGO_ESTADO, TAREA_ESTADO } from '@/lib/lms-formatters';
import { useI18n } from '@/lib/i18n/index.jsx';

// ─────────────────────────────────────────────────────────────
// F2.B1 — Dashboard del estudiante: próxima clase, tareas
// pendientes, sesiones restantes del paquete y nivel MCER.
// ─────────────────────────────────────────────────────────────

export default function EstudianteDashboard() {
  const { t, lang } = useI18n();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setData(await dashboardApi.me());
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <Spinner />;

  const { matricula, proximaClase, tareasPendientes, promedioNota, contactoDocente, pagosRecientes, perfil } = data;

  return (
    <div className="space-y-6">
      <LmsPage
        title={t('lms.student.dashboardTitle')}
        subtitle={t('lms.student.dashboardSubtitle', { nombre: perfil?.proposito || t('lms.estudiante') })}
      />

      {/* Fila principal: matrícula y próxima clase */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Paquete / matrícula */}
        <div className="bg-gradient-to-br from-[#3C3B6E] to-[#2e2d5a] text-white rounded-xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-white/70 text-xs uppercase tracking-wider">{t('lms.student.package')}</p>
            {matricula ? <NivelBadge nivel={matricula.nivelMCER} /> : null}
          </div>
          {matricula ? (
            <>
              <h3 className="text-lg font-bold mt-1">{matricula.paquete ?? matricula.curso}</h3>
              <p className="text-white/70 text-sm mt-0.5">{matricula.curso}</p>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-4xl font-bold">{matricula.sesionesRestantes}</span>
                <span className="text-white/70 text-sm pb-1">{t('lms.student.sessionsLeft')}</span>
              </div>
              <div className="mt-3 w-full h-2 bg-white/15 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#B22234] rounded-full"
                  style={{ width: `${Math.min(100, Math.round((matricula.sesionesUsadas / matricula.sesionesContratadas) * 100))}%` }}
                />
              </div>
              <p className="text-[11px] text-white/60 mt-1.5">
                {t('lms.student.usedOf')} {matricula.sesionesUsadas} / {matricula.sesionesContratadas}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-white/70">{t('lms.student.noEnrollment')}</p>
          )}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-3 text-xs text-white/70">
            {contactoDocente && (
              <>
                <MessageCircle className="w-3.5 h-3.5" />
                <Link to="/estudiante/mensajes" className="hover:text-white underline underline-offset-2">
                  {contactoDocente.nombre}
                </Link>
              </>
            )}
            {perfil && <span className="ml-auto">{perfil.nivelMCER} · {t('lms.student.level')}</span>}
          </div>
        </div>

        {/* Próxima clase */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 text-slate-500">
            <CalendarDays className="w-4 h-4" />
            <p className="text-xs font-medium uppercase tracking-wide">{t('lms.student.nextClass')}</p>
          </div>
          {proximaClase ? (
            <>
              <p className="text-lg font-bold text-slate-800 mt-2">{formatFechaHora(proximaClase.fechaHora, lang)}</p>
              <p className="text-sm text-slate-500 mt-0.5">{proximaClase.tema || t('lms.class')}</p>
              <div className="mt-3 flex items-center gap-2">
                <EstadoBadge estado={proximaClase.estado} label={t(`lms.session.estado.${proximaClase.estado}`)} />
                {proximaClase.enlaceVideo && (
                  <a
                    href={proximaClase.enlaceVideo}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#3C3B6E] text-white px-3 py-1.5 rounded-lg hover:bg-[#2e2d5a] transition-colors"
                  >
                    <Video className="w-3.5 h-3.5" /> {t('lms.student.join')}
                  </a>
                )}
              </div>
              <Link to="/estudiante/clases" className="inline-flex items-center gap-1 text-xs text-[#3C3B6E] font-medium mt-3 hover:underline">
                {t('lms.student.viewAgenda')} <ArrowRight className="w-3 h-3" />
              </Link>
            </>
          ) : (
            <p className="text-sm text-slate-400 mt-3">{t('lms.student.noNextClass')}</p>
          )}
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('lms.student.pendingTasks')} value={data.tareasPendientesCount} icon={ClipboardList} />
        <StatCard label={t('lms.student.avgGrade')} value={promedioNota !== null ? `${promedioNota}/100` : '—'} icon={TrendingUp} color="text-green-600" />
        <StatCard label={t('lms.student.levels')} value={perfil?.nivelMCER ?? matricula?.nivelMCER ?? '—'} icon={GraduationCap} color="text-[#B22234]" />
        <StatCard label={t('lms.student.recentPayments')} value={pagosRecientes?.length ?? 0} icon={CreditCard} />
      </div>

      {/* Tareas pendientes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-[#3C3B6E]" /> {t('lms.student.pendingTasks')}
          </h3>
          <Link to="/estudiante/tareas" className="text-xs text-[#3C3B6E] font-medium hover:underline">{t('lms.verTodas')}</Link>
        </div>
        {tareasPendientes.length === 0 ? (
          <EmptyState icon={ClipboardList} title={t('lms.student.noPendingTasks')} />
        ) : (
          <div className="space-y-2">
            {tareasPendientes.slice(0, 4).map((task) => (
              <Link
                key={task.id}
                to={`/estudiante/tareas/${task.id}`}
                className="flex items-center justify-between gap-3 bg-white rounded-lg border border-slate-100 shadow-sm px-4 py-3 hover:border-[#3C3B6E]/30 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{task.titulo}</p>
                  <p className="text-[11px] text-slate-400">
                    {t('lms.task.due')}: {task.fechaLimite ? formatFechaHora(task.fechaLimite, lang) : '—'}
                  </p>
                </div>
                <EstadoBadge estado={task.estado} label={etiqueta(TAREA_ESTADO, task.estado, lang)} />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Pagos recientes */}
      <div>
        <h3 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-[#3C3B6E]" /> {t('lms.student.recentPayments')}
        </h3>
        {pagosRecientes?.length ? (
          <div className="bg-white rounded-lg border border-slate-100 shadow-sm divide-y divide-slate-50">
            {pagosRecientes.slice(0, 4).map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-slate-700 truncate">{p.concepto}</p>
                  <p className="text-[11px] text-slate-400">{p.metodo} · {formatFechaHora(p.fecha, lang)}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-semibold text-slate-800">{formatCOP(p.valorCOP)}</span>
                  <EstadoBadge estado={p.estado} label={etiqueta(PAGO_ESTADO, p.estado, lang)} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={CreditCard} title={t('lms.student.noPayments')} />
        )}
      </div>
    </div>
  );
}
