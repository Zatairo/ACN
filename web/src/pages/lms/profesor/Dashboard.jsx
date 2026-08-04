import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, ClipboardCheck, AlertTriangle, Users, ArrowRight } from 'lucide-react';
import { dashboardApi } from '@/api/lmsClient';
import { LmsPage, StatCard, Spinner, EmptyState } from '@/components/lms/common';
import { formatFechaHora } from '@/lib/lms-formatters';
import { useI18n } from '@/lib/i18n/index.jsx';
import { useNotifications } from '@/lib/NotificationsContext';

// ─────────────────────────────────────────────────────────────
// F2.C1 — Dashboard del profesor: próxima clase, tareas por
// calificar, alertas de pago y su lista de estudiantes.
// ─────────────────────────────────────────────────────────────

export default function ProfesorDashboard() {
  const { t, lang } = useI18n();
  const { check } = useNotifications();
  const [dash, setDash] = useState(null);

  const load = useCallback(async () => {
    try {
      const d = await dashboardApi.me();
      setDash(d);
      check?.();
    } catch {
      setDash({ porCalificar: [], alertasPagos: [], proximasClases: [], estudiantes: [] });
    }
  }, [check]);

  useEffect(() => {
    load();
  }, [load]);

  if (!dash) return <Spinner />;

  return (
    <div className="space-y-6">
      <LmsPage title={t('lms.teacher.dashboard.title')} subtitle={t('lms.teacher.dashboard.subtitle')} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('lms.teacher.dashboard.porCalificar')} value={dash.porCalificar?.length ?? 0} icon={ClipboardCheck} color="text-[#B22234]" />
        <StatCard label={t('lms.teacher.dashboard.alertasPago')} value={dash.alertasPagos?.length ?? 0} icon={AlertTriangle} color="text-amber-600" />
        <StatCard label={t('lms.teacher.dashboard.estudiantes')} value={dash.estudiantes?.length ?? 0} icon={Users} color="text-[#3C3B6E]" />
        <StatCard label={t('lms.teacher.dashboard.proximas')} value={dash.proximasClases?.length ?? 0} icon={CalendarClock} color="text-green-600" />
      </div>

      {dash.proximaClase && (
        <div className="bg-gradient-to-br from-[#3C3B6E] to-[#2e2d5a] text-white rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-white/60 text-xs uppercase tracking-wider">{t('lms.teacher.dashboard.nextClass')}</p>
            <p className="text-lg font-bold">{dash.proximaClase.estudiante}</p>
            <p className="text-sm text-white/70">{formatFechaHora(dash.proximaClase.fechaHora, lang)}</p>
          </div>
          <Link to="/profesor/agenda" className="inline-flex items-center gap-1 text-xs font-semibold bg-white/15 hover:bg-white/25 px-4 py-2 rounded-lg transition-colors">
            {t('lms.teacher.dashboard.seeAgenda')} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Tareas por calificar */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-[#B22234]" /> {t('lms.teacher.dashboard.porCalificar')}
            </h3>
            <Link to="/profesor/tareas" className="text-xs text-[#3C3B6E] hover:underline flex items-center gap-1">
              {t('lms.verTodas')} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {dash.porCalificar?.length === 0 ? (
            <EmptyState icon={ClipboardCheck} title={t('lms.teacher.dashboard.sinPorCalificar')} />
          ) : (
            <div className="divide-y divide-slate-50">
              {dash.porCalificar.map((tt) => (
                <Link key={tt.id} to={`/profesor/tareas?calificar=${tt.id}`} className="flex items-center justify-between py-2.5 hover:bg-slate-50 px-2 -mx-2 rounded-lg">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{tt.titulo}</p>
                    <p className="text-xs text-slate-400">{tt.estudiante}</p>
                  </div>
                  <span className="text-xs text-[#B22234] font-semibold shrink-0">{t('lms.calificar')} →</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Alertas de pago */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> {t('lms.teacher.dashboard.alertasPago')}
            </h3>
            <Link to="/admin/cobros" className="text-xs text-[#3C3B6E] hover:underline flex items-center gap-1">
              {t('lms.verTodos')} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {dash.alertasPagos?.length === 0 ? (
            <EmptyState icon={AlertTriangle} title={t('lms.teacher.dashboard.sinAlertas')} />
          ) : (
            <div className="divide-y divide-slate-50">
              {dash.alertasPagos.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{p.concepto}</p>
                    <p className="text-xs text-slate-400">{p.estudiante}</p>
                  </div>
                  <span className="text-xs font-semibold text-amber-600 shrink-0">{p.valorCOP.toLocaleString('es-CO')} COP</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Próximas clases */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-[#3C3B6E]" /> {t('lms.teacher.dashboard.proximasClases')}
          </h3>
          <Link to="/profesor/agenda" className="text-xs text-[#3C3B6E] hover:underline flex items-center gap-1">
            {t('lms.verTodas')} <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {dash.proximasClases?.length === 0 ? (
          <EmptyState icon={CalendarClock} title={t('lms.teacher.dashboard.sinClases')} />
        ) : (
          <div className="divide-y divide-slate-50">
            {dash.proximasClases.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">{s.estudiante}</p>
                  <p className="text-xs text-slate-400">{s.tema ?? t('lms.teacher.dashboard.sinTema')}</p>
                </div>
                <span className="text-xs text-slate-500 shrink-0">{formatFechaHora(s.fechaHora, lang)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
