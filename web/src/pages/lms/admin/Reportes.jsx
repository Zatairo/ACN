import { useState, useEffect, useCallback } from 'react';
import { BarChart3, GraduationCap, CalendarCheck, ClipboardList, Star } from 'lucide-react';
import { reportsApi } from '@/api/lmsClient';
import { LmsPage, Spinner, EmptyState, NivelBadge } from '@/components/lms/common';
import { useI18n } from '@/lib/i18n/index.jsx';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────
// F2.D7 — Reportes académicos: asistencia por estudiante y
// progreso (tareas, notas, práctica, sesiones completadas).
// ─────────────────────────────────────────────────────────────

export default function AdminReportes() {
  const { t, lang } = useI18n();
  const [asistencia, setAsistencia] = useState(null);
  const [progreso, setProgreso] = useState(null);

  const load = useCallback(async () => {
    try {
      const [a, p] = await Promise.all([reportsApi.attendance(), reportsApi.progress()]);
      setAsistencia(a);
      setProgreso(p);
    } catch {
      setAsistencia([]);
      setProgreso([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!asistencia || !progreso) return <Spinner />;

  const pctColor = (pct) => (pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-[#B22234]');

  return (
    <div className="space-y-6">
      <LmsPage title={t('lms.admin.reportes.title')} subtitle={t('lms.admin.reportes.subtitle')} />

      {/* Asistencia */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <CalendarCheck className="w-4 h-4 text-[#3C3B6E]" /> {t('lms.admin.reportes.asistencia')}
        </h3>
        {asistencia.length === 0 ? (
          <EmptyState icon={CalendarCheck} title={t('lms.admin.dashboard.sinAsistencia')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                  <th className="px-3 py-2">{t('lms.admin.users.name')}</th>
                  <th className="px-3 py-2">{t('lms.admin.reportes.curso')}</th>
                  <th className="px-3 py-2 text-center">{t('lms.admin.reportes.total')}</th>
                  <th className="px-3 py-2 text-center">{t('lms.admin.reportes.completadas')}</th>
                  <th className="px-3 py-2 text-center">{t('lms.admin.reportes.noShow')}</th>
                  <th className="px-3 py-2">{t('lms.admin.reportes.asistenciaPct')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {asistencia.map((a) => (
                  <tr key={a.enrollmentId} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5 font-medium text-slate-800">{a.estudiante}</td>
                    <td className="px-3 py-2.5 text-slate-500">{a.curso} <NivelBadge nivel={a.nivelMCER} /></td>
                    <td className="px-3 py-2.5 text-center text-slate-600">{a.totalSesiones}</td>
                    <td className="px-3 py-2.5 text-center text-slate-600">{a.completadas}</td>
                    <td className="px-3 py-2.5 text-center text-slate-600">{a.noShow}</td>
                    <td className="px-3 py-2.5 w-40">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={cn('h-full rounded-full', pctColor(a.asistenciaPct))} style={{ width: `${a.asistenciaPct}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-slate-600">{a.asistenciaPct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Progreso */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-[#3C3B6E]" /> {t('lms.admin.reportes.progreso')}
        </h3>
        {progreso.length === 0 ? (
          <EmptyState icon={GraduationCap} title={t('lms.admin.reportes.sinProgreso')} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {progreso.map((p) => (
              <div key={p.estudianteId} className="rounded-xl bg-slate-50 p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800">{p.nombre}</p>
                  {p.nivelMCER && <NivelBadge nivel={p.nivelMCER} />}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white rounded-lg px-2 py-1.5">
                    <p className="text-slate-400 flex items-center gap-1"><ClipboardList className="w-3 h-3" /> {t('lms.admin.reportes.tareas')}</p>
                    <p className="font-semibold text-slate-700">{p.tareasCalificadas}/{p.tareasAsignadas}</p>
                  </div>
                  <div className="bg-white rounded-lg px-2 py-1.5">
                    <p className="text-slate-400 flex items-center gap-1"><Star className="w-3 h-3" /> {t('lms.admin.reportes.promedio')}</p>
                    <p className="font-semibold text-slate-700">{p.promedioNota !== null ? `${p.promedioNota}/100` : '—'}</p>
                  </div>
                  <div className="bg-white rounded-lg px-2 py-1.5">
                    <p className="text-slate-400 flex items-center gap-1"><BarChart3 className="w-3 h-3" /> {t('lms.admin.reportes.practica')}</p>
                    <p className="font-semibold text-slate-700">{p.intentosPractica} ({p.promedioPractica ?? '—'})</p>
                  </div>
                  <div className="bg-white rounded-lg px-2 py-1.5">
                    <p className="text-slate-400 flex items-center gap-1"><CalendarCheck className="w-3 h-3" /> {t('lms.admin.reportes.sesiones')}</p>
                    <p className="font-semibold text-slate-700">{p.sesionesCompletadas}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
