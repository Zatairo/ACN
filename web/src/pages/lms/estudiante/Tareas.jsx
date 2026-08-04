import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, FileText } from 'lucide-react';
import { tasksApi } from '@/api/lmsClient';
import { LmsPage, EstadoBadge, Spinner, EmptyState } from '@/components/lms/common';
import { formatFechaHora, etiqueta, TAREA_ESTADO, TAREA_TIPO } from '@/lib/lms-formatters';
import { useI18n } from '@/lib/i18n/index.jsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// ─────────────────────────────────────────────────────────────
// F2.B3 — Tareas del estudiante: lista por estado (pendientes,
// entregadas, calificadas) con enlace al detalle.
// ─────────────────────────────────────────────────────────────

export default function EstudianteTareas() {
  const { t, lang } = useI18n();
  const [tasks, setTasks] = useState(null);

  const load = useCallback(async () => {
    try {
      setTasks(await tasksApi.list());
    } catch {
      setTasks([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!tasks) return <Spinner />;

  const pendientes = tasks.filter((x) => x.estado === 'ASSIGNED');
  const entregadas = tasks.filter((x) => x.estado === 'SUBMITTED');
  const calificadas = tasks.filter((x) => x.estado === 'GRADED');

  const TaskCard = ({ task }) => {
    const nota = task.grades?.[0]?.nota;
    return (
      <Link
        to={`/estudiante/tareas/${task.id}`}
        className="block bg-white rounded-lg border border-slate-100 shadow-sm px-4 py-3 hover:border-[#3C3B6E]/30 transition-colors"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-slate-800 truncate">{task.titulo}</p>
              <span className="text-[11px] text-slate-400 uppercase tracking-wide">
                {etiqueta(TAREA_TIPO, task.tipo, lang)}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {t('lms.task.due')}: {task.fechaLimite ? formatFechaHora(task.fechaLimite, lang) : '—'}
              {task.submissions?.length > 0 && ` · ${t('lms.task.submitted')}: ${formatFechaHora(task.submissions[0].fechaEntrega, lang)}`}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {nota !== undefined && <span className="font-bold text-green-600">{nota}/100</span>}
            <EstadoBadge estado={task.estado} label={etiqueta(TAREA_ESTADO, task.estado, lang)} />
          </div>
        </div>
      </Link>
    );
  };

  const Lista = ({ items, empty, icon }) =>
    items.length === 0 ? (
      <EmptyState icon={icon} title={empty} />
    ) : (
      <div className="space-y-2">{items.map((task) => <TaskCard key={task.id} task={task} />)}</div>
    );

  return (
    <div className="space-y-6">
      <LmsPage title={t('lms.student.tasks')} subtitle={t('lms.student.tasksSubtitle')} />

      <Tabs defaultValue="pendientes">
        <TabsList>
          <TabsTrigger value="pendientes">
            {t('lms.student.pendingTasks')} ({pendientes.length})
          </TabsTrigger>
          <TabsTrigger value="entregadas">{t('lms.task.submitted')} ({entregadas.length})</TabsTrigger>
          <TabsTrigger value="calificadas">{t('lms.task.graded')} ({calificadas.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pendientes" className="mt-4">
          <Lista items={pendientes} empty={t('lms.student.noPendingTasks')} icon={ClipboardList} />
        </TabsContent>
        <TabsContent value="entregadas" className="mt-4">
          <Lista items={entregadas} empty={t('lms.student.noSubmitted')} icon={FileText} />
        </TabsContent>
        <TabsContent value="calificadas" className="mt-4">
          <Lista items={calificadas} empty={t('lms.student.noGraded')} icon={FileText} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
