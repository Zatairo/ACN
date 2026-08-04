import { useState, useEffect, useCallback } from 'react';
import { Users, UserCircle2, GraduationCap, CheckSquare, CalendarClock } from 'lucide-react';
import { dashboardApi, profilesApi, sessionsApi, tasksApi } from '@/api/lmsClient';
import { LmsPage, Spinner, EmptyState, NivelBadge } from '@/components/lms/common';
import { formatFechaHora, TAREA_ESTADO, etiqueta, SESION_ESTADO } from '@/lib/lms-formatters';
import { useI18n } from '@/lib/i18n/index.jsx';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────
// F2.C3 — Estudiantes del profesor: lista con nivel y saldo de
// sesiones; ficha con perfil RAG, sesiones y tareas de cada uno.
// ─────────────────────────────────────────────────────────────

export default function ProfesorEstudiantes() {
  const { t, lang } = useI18n();
  const [estudiantes, setEstudiantes] = useState(null);
  const [seleccionado, setSeleccionado] = useState(null); // { id, nombre }
  const [ficha, setFicha] = useState(null); // { perfil, sesiones, tareas }

  const load = useCallback(async () => {
    try {
      const dash = await dashboardApi.me();
      setEstudiantes(dash.estudiantes ?? []);
    } catch {
      setEstudiantes([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const abrirFicha = async (e) => {
    setSeleccionado(e);
    setFicha(null);
    try {
      const [perfil, sesiones, tareas] = await Promise.all([
        profilesApi.get(e.id),
        sessionsApi.list({ studentId: e.id }),
        tasksApi.list({ studentId: e.id }),
      ]);
      setFicha({ perfil, sesiones, tareas });
    } catch {
      setFicha({ perfil: null, sesiones: [], tareas: [] });
    }
  };

  if (!estudiantes) return <Spinner />;

  const camposPerfil = ficha?.perfil
    ? [
        [t('lms.perfil.proposito'), ficha.perfil.proposito],
        [t('lms.perfil.industria'), ficha.perfil.industria],
        [t('lms.perfil.profesion'), ficha.perfil.profesion],
        [t('lms.perfil.intereses'), ficha.perfil.intereses],
        [t('lms.perfil.objetivo'), ficha.perfil.objetivo],
      ].filter(([, v]) => v)
    : [];

  return (
    <div className="space-y-6">
      <LmsPage title={t('lms.teacher.students.title')} subtitle={t('lms.teacher.students.subtitle')} />

      <div className="grid lg:grid-cols-[320px_1fr] gap-4">
        {/* Lista */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden h-fit">
          {estudiantes.length === 0 ? (
            <div className="p-6"><EmptyState icon={Users} title={t('lms.teacher.students.empty')} /></div>
          ) : (
            estudiantes.map((e) => (
              <button
                key={e.id}
                onClick={() => abrirFicha(e)}
                className={cn(
                  'w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors',
                  seleccionado?.id === e.id && 'bg-[#3C3B6E]/5',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800">{e.nombre}</p>
                  {e.nivelMCER && <NivelBadge nivel={e.nivelMCER} />}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {e.sesionesRestantes} {t('lms.student.sessionsLeft')}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Ficha */}
        <div className="space-y-4">
          {!seleccionado ? (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-10">
              <EmptyState icon={UserCircle2} title={t('lms.teacher.students.selectHint')} />
            </div>
          ) : !ficha ? (
            <Spinner />
          ) : (
            <>
              {/* Perfil RAG */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2 mb-3">
                  <UserCircle2 className="w-4 h-4 text-[#3C3B6E]" /> {t('lms.perfil.ragInfo')}
                </h3>
                {camposPerfil.length === 0 ? (
                  <p className="text-sm text-slate-400">{t('lms.teacher.students.noProfile')}</p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                    {camposPerfil.map(([label, valor]) => (
                      <div key={label}>
                        <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
                        <p className="text-sm text-slate-700">{valor}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                {/* Sesiones */}
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                  <h3 className="font-semibold text-slate-700 flex items-center gap-2 mb-3">
                    <CalendarClock className="w-4 h-4 text-[#3C3B6E]" /> {t('lms.teacher.students.sessions')}
                  </h3>
                  {ficha.sesiones.length === 0 ? (
                    <p className="text-sm text-slate-400">{t('lms.teacher.students.noSessions')}</p>
                  ) : (
                    <div className="space-y-2">
                      {ficha.sesiones.slice(0, 8).map((s) => (
                        <div key={s.id} className="flex items-center justify-between gap-2 text-sm">
                          <span className="text-slate-700">{formatFechaHora(s.fechaHora, lang)}</span>
                          <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full',
                            s.estado === 'COMPLETED' && s.asistio && 'bg-green-50 text-green-700',
                            s.estado === 'COMPLETED' && !s.asistio && 'bg-amber-50 text-amber-700',
                            (s.estado === 'SCHEDULED' || s.estado === 'RESCHEDULED') && 'bg-blue-50 text-blue-700',
                            (s.estado === 'CANCELLED' || s.estado === 'NO_SHOW') && 'bg-slate-100 text-slate-500',
                          )}>
                            {etiqueta(SESION_ESTADO, s.estado, lang)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tareas */}
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                  <h3 className="font-semibold text-slate-700 flex items-center gap-2 mb-3">
                    <CheckSquare className="w-4 h-4 text-[#3C3B6E]" /> {t('lms.teacher.students.tasks')}
                  </h3>
                  {ficha.tareas.length === 0 ? (
                    <p className="text-sm text-slate-400">{t('lms.teacher.students.noTasks')}</p>
                  ) : (
                    <div className="space-y-2">
                      {ficha.tareas.slice(0, 8).map((tt) => (
                        <div key={tt.id} className="flex items-center justify-between gap-2 text-sm">
                          <div className="min-w-0">
                            <p className="text-slate-700 truncate">{tt.titulo}</p>
                            <p className="text-[11px] text-slate-400">{t(`lms.tareas.tipo.${tt.tipo}`)}</p>
                          </div>
                          <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0',
                            tt.estado === 'GRADED' && 'bg-green-50 text-green-700',
                            tt.estado === 'SUBMITTED' && 'bg-amber-50 text-amber-700',
                            tt.estado === 'ASSIGNED' && 'bg-blue-50 text-blue-700',
                          )}>
                            {etiqueta(TAREA_ESTADO, tt.estado, lang)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Nivel */}
              <div className="bg-gradient-to-br from-[#3C3B6E] to-[#2e2d5a] text-white rounded-xl p-4 flex items-center gap-3">
                <GraduationCap className="w-5 h-5 text-white/70" />
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-white/60">{t('lms.perfil.nivelMCER')}</p>
                  <p className="font-bold">{ficha.perfil?.nivelMCER ?? '—'}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-[11px] uppercase tracking-wide text-white/60">{t('lms.student.sessionsLeft')}</p>
                  <p className="font-bold">{seleccionado?.sesionesRestantes ?? 0}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
