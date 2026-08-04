import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, PlayCircle } from 'lucide-react';
import { activitiesApi } from '@/api/lmsClient';
import { LmsPage, Spinner, EmptyState, NivelBadge } from '@/components/lms/common';
import { etiqueta, ACTIVIDAD_TIPO } from '@/lib/lms-formatters';
import { useI18n } from '@/lib/i18n/index.jsx';

// ─────────────────────────────────────────────────────────────
// F2.B4 — Prácticas del estudiante: actividades interactivas del
// curso alimentadas desde /api/activities (fill-blanks,
// word-search, quiz, listening).
// ─────────────────────────────────────────────────────────────

export default function EstudiantePracticas() {
  const { t, lang } = useI18n();
  const [activities, setActivities] = useState(null);

  const load = useCallback(async () => {
    try {
      setActivities(await activitiesApi.list());
    } catch {
      setActivities([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!activities) return <Spinner />;

  return (
    <div className="space-y-6">
      <LmsPage title={t('lms.student.practices')} subtitle={t('lms.student.practicesSubtitle')} />

      {activities.length === 0 ? (
        <EmptyState icon={Gamepad2} title={t('lms.student.noPractices')} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {activities.map((a) => (
            <Link
              key={a.id}
              to={`/estudiante/practicas/${a.id}`}
              className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 hover:border-[#3C3B6E]/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-[#3C3B6E]/10 flex items-center justify-center">
                    <Gamepad2 className="w-4 h-4 text-[#3C3B6E]" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">
                      {a.contenidoJson?.titulo || a.titulo || a.tipo}
                    </p>
                    <p className="text-[11px] text-slate-400 uppercase tracking-wide">
                      {etiqueta(ACTIVIDAD_TIPO, a.tipo, lang)}
                    </p>
                  </div>
                </div>
                <NivelBadge nivel={a.nivelMCER} />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {a._count?.attempts ?? 0} {t('lms.student.attempts')}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#3C3B6E]">
                  <PlayCircle className="w-3.5 h-3.5" /> {t('lms.student.start')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
