import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Users, Wallet, AlertTriangle, CalendarCheck, Target, ArrowRight } from 'lucide-react';
import { dashboardApi } from '@/api/lmsClient';
import { LmsPage, StatCard, Spinner, EmptyState } from '@/components/lms/common';
import { useI18n } from '@/lib/i18n/index.jsx';
import { formatCOP } from '@/lib/lms-formatters';

// ─────────────────────────────────────────────────────────────
// F2.D1 — Dashboard administrativo: KPIs del negocio (ingresos
// del mes, mora, asistencia, leads) y alertas de cobro.
// ─────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { t } = useI18n();
  const [dash, setDash] = useState(null);

  const load = useCallback(async () => {
    try {
      setDash(await dashboardApi.me());
    } catch {
      setDash({ kpis: {}, alertasPagos: [], asistenciaPorEstudiante: [] });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!dash) return <Spinner />;

  const k = dash.kpis ?? {};

  return (
    <div className="space-y-6">
      <LmsPage title={t('lms.admin.dashboard.title')} subtitle={t('lms.admin.dashboard.subtitle')} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('lms.admin.dashboard.ingresosMes')} value={formatCOP(k.ingresosMesCOP ?? 0)} icon={Wallet} color="text-green-600" />
        <StatCard label={t('lms.admin.dashboard.estudiantesActivos')} value={k.estudiantesActivos ?? 0} icon={Users} color="text-[#3C3B6E]" />
        <StatCard label={t('lms.admin.dashboard.mora')} value={formatCOP(k.moraCOP ?? 0)} icon={AlertTriangle} color="text-[#B22234]" />
        <StatCard label={t('lms.admin.dashboard.asistencia')} value={`${k.asistenciaMes ?? 0}%`} icon={CalendarCheck} color="text-blue-600" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('lms.admin.dashboard.clasesMes')} value={k.clasesCompletadasMes ?? 0} icon={CalendarCheck} color="text-blue-600" />
        <StatCard label={t('lms.admin.dashboard.pagosPendientes')} value={k.pagosPendientes ?? 0} icon={Wallet} color="text-amber-600" />
        <StatCard label={t('lms.admin.dashboard.leadsNuevos')} value={k.leadsNuevos ?? 0} icon={Target} color="text-purple-600" />
        <StatCard label={t('lms.admin.dashboard.leadsCerrados')} value={k.leadsCerrados ?? 0} icon={Target} color="text-green-600" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Alertas de pago */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> {t('lms.admin.dashboard.alertasPago')}
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
                  <span className="text-xs font-semibold text-amber-600 shrink-0">{formatCOP(p.valorCOP)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Asistencia por estudiante */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-[#3C3B6E]" /> {t('lms.admin.dashboard.asistenciaPorEstudiante')}
          </h3>
          {dash.asistenciaPorEstudiante?.length === 0 ? (
            <EmptyState icon={CalendarCheck} title={t('lms.admin.dashboard.sinAsistencia')} />
          ) : (
            <div className="space-y-3">
              {dash.asistenciaPorEstudiante.map((e) => {
                const pct = e.completadas > 0 ? Math.round((e.asistio / e.completadas) * 100) : 0;
                return (
                  <div key={e.estudiante}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-700 font-medium">{e.estudiante}</span>
                      <span className="text-xs text-slate-500">{e.asistio}/{e.completadas} · {pct}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-[#B22234]'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
