import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FilePlus2, Loader2, CheckSquare, ClipboardCheck, Download } from 'lucide-react';
import { tasksApi, coursesApi, dashboardApi } from '@/api/lmsClient';
import { LmsPage, EstadoBadge, Spinner, EmptyState } from '@/components/lms/common';
import { formatFechaHora, TAREA_ESTADO, TAREA_TIPO, etiqueta } from '@/lib/lms-formatters';
import { useI18n } from '@/lib/i18n/index.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

// ─────────────────────────────────────────────────────────────
// F2.C4 — Tareas del profesor: crear tareas para sus estudiantes
// y calificar entregas con rúbrica y feedback (por URL).
// ─────────────────────────────────────────────────────────────

export default function ProfesorTareas() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const [tareas, setTareas] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [creando, setCreando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({});
  const [calificando, setCalificando] = useState(null); // tarea en diálogo
  const [nota, setNota] = useState(85);
  const [feedback, setFeedback] = useState('');
  const [enviandoNota, setEnviandoNota] = useState(false);

  const load = useCallback(async () => {
    try {
      const [tt, cr, dash] = await Promise.all([tasksApi.list(), coursesApi.list(), dashboardApi.me()]);
      setTareas(tt);
      setCursos(cr);
      setEstudiantes(dash.estudiantes ?? []);
    } catch {
      setTareas([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Abrir calificación desde el dashboard (?calificar=id)
  useEffect(() => {
    const id = params.get('calificar');
    if (id && tareas) {
      const tarea = tareas.find((x) => String(x.id) === id);
      if (tarea && tarea.estado === 'SUBMITTED') {
        setCalificando(tarea);
        setParams({}, { replace: true });
      }
    }
  }, [params, tareas, setParams]);

  if (!tareas) return <Spinner />;

  const crearTarea = async () => {
    setGuardando(true);
    try {
      await tasksApi.create({
        courseId: Number(form.courseId),
        studentId: Number(form.studentId),
        tipo: form.tipo,
        titulo: form.titulo,
        descripcion: form.descripcion || null,
        nivelMCER: form.nivelMCER,
        fechaLimite: form.fechaLimite ? new Date(form.fechaLimite).toISOString() : null,
      });
      toast({ title: t('lms.teacher.tasks.created') });
      setCreando(false);
      setForm({});
      load();
    } catch (err) {
      toast({ title: t('lms.error'), description: err.message, variant: 'destructive' });
    } finally {
      setGuardando(false);
    }
  };

  const enviarNota = async () => {
    const entrega = calificando?.submissions?.[0];
    if (!entrega) return;
    setEnviandoNota(true);
    try {
      await tasksApi.grade(calificando.id, {
        submissionId: entrega.id,
        nota: Math.round(Number(nota)),
        feedback: feedback || null,
      });
      toast({ title: t('lms.teacher.tasks.graded') });
      setCalificando(null);
      setNota(85);
      setFeedback('');
      load();
    } catch (err) {
      toast({ title: t('lms.error'), description: err.message, variant: 'destructive' });
    } finally {
      setEnviandoNota(false);
    }
  };

  return (
    <div className="space-y-6">
      <LmsPage
        title={t('lms.teacher.tasks.title')}
        subtitle={t('lms.teacher.tasks.subtitle')}
        actions={
          <Button onClick={() => setCreando(true)} disabled={cursos.length === 0 || estudiantes.length === 0}>
            <FilePlus2 className="w-4 h-4 mr-2" /> {t('lms.teacher.tasks.new')}
          </Button>
        }
      />

      {tareas.length === 0 ? (
        <EmptyState icon={CheckSquare} title={t('lms.teacher.tasks.empty')} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm divide-y divide-slate-50">
          {tareas.map((tt) => {
            const entrega = tt.submissions?.[0];
            const porCalificar = tt.estado === 'SUBMITTED' && entrega;
            return (
              <div key={tt.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-800">{tt.titulo}</p>
                    <EstadoBadge estado={tt.estado} label={etiqueta(TAREA_ESTADO, tt.estado, lang)} />
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {tt.student?.nombre} · {t(`lms.tareas.tipo.${tt.tipo}`)} · {tt.course?.titulo}
                    {tt.fechaLimite && ` · ${t('lms.tareas.fechaLimite')}: ${formatFechaHora(tt.fechaLimite, lang)}`}
                  </p>
                  {tt.grades?.length > 0 && (
                    <p className="text-xs text-green-600 mt-0.5 font-semibold">
                      {t('lms.teacher.tasks.nota')}: {tt.grades[tt.grades.length - 1].nota}/100
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCalificando(tt);
                      setNota(tt.grades?.[0]?.nota ?? 85);
                      setFeedback(tt.grades?.[0]?.feedback ?? '');
                    }}
                  >
                    <ClipboardCheck className="w-3.5 h-3.5 mr-1" /> {t('lms.teacher.tasks.detail')}
                  </Button>
                  {porCalificar && (
                    <Button
                      size="sm"
                      className="bg-[#B22234] hover:bg-[#8f1a28] text-white"
                      onClick={() => {
                        setCalificando(tt);
                        setNota(85);
                        setFeedback('');
                      }}
                    >
                      {t('lms.calificar')}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Crear tarea */}
      <Dialog open={creando} onOpenChange={(o) => !o && setCreando(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('lms.teacher.tasks.new')}</DialogTitle>
            <DialogDescription>{t('lms.teacher.tasks.newDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>{t('lms.teacher.tasks.student')}</Label>
              <Select value={form.studentId} onValueChange={(v) => setForm((f) => ({ ...f, studentId: v }))}>
                <SelectTrigger><SelectValue placeholder={t('lms.teacher.agenda.selectStudent')} /></SelectTrigger>
                <SelectContent>
                  {estudiantes.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>{e.nombre} ({e.nivelMCER ?? '—'})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('lms.teacher.tasks.course')}</Label>
              <Select value={form.courseId} onValueChange={(v) => setForm((f) => ({ ...f, courseId: v }))}>
                <SelectTrigger><SelectValue placeholder={t('lms.teacher.tasks.selectCourse')} /></SelectTrigger>
                <SelectContent>
                  {cursos.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.titulo} ({c.nivelMCER})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t('lms.teacher.tasks.type')}</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v }))}>
                  <SelectTrigger><SelectValue placeholder={t('lms.teacher.tasks.type')} /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(TAREA_TIPO).map((k) => (
                      <SelectItem key={k} value={k}>{etiqueta(TAREA_TIPO, k, lang)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('lms.perfil.nivelMCER')}</Label>
                <Select value={form.nivelMCER} onValueChange={(v) => setForm((f) => ({ ...f, nivelMCER: v }))}>
                  <SelectTrigger><SelectValue placeholder="B1" /></SelectTrigger>
                  <SelectContent>
                    {['A1', 'A2', 'B1', 'B2', 'C1'].map((n) => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('lms.tareas.titulo')}</Label>
              <Input value={form.titulo ?? ''} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} placeholder={t('lms.teacher.tasks.titlePh')} />
            </div>
            <div className="space-y-2">
              <Label>{t('lms.tareas.descripcion')}</Label>
              <Textarea rows={3} value={form.descripcion ?? ''} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} placeholder={t('lms.teacher.tasks.descPh')} />
            </div>
            <div className="space-y-2">
              <Label>{t('lms.tareas.fechaLimite')}</Label>
              <Input type="datetime-local" value={form.fechaLimite ?? ''} onChange={(e) => setForm((f) => ({ ...f, fechaLimite: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreando(false)}>{t('lms.cancelar')}</Button>
              <Button onClick={crearTarea} disabled={guardando || !form.studentId || !form.courseId || !form.tipo || !form.titulo?.trim()}>
                {guardando && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t('lms.guardar')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Calificar */}
      <Dialog open={!!calificando} onOpenChange={(o) => !o && setCalificando(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('lms.teacher.tasks.grade')}: {calificando?.titulo}</DialogTitle>
            <DialogDescription>{calificando?.student?.nombre} · {etiqueta(TAREA_TIPO, calificando?.tipo, lang)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Entrega */}
            <div className="rounded-lg bg-slate-50 p-3 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase">{t('lms.teacher.tasks.submission')}</p>
              {calificando?.submissions?.length === 0 ? (
                <p className="text-sm text-slate-400">{t('lms.teacher.tasks.noSubmission')}</p>
              ) : (
                <>
                  {calificando?.submissions?.[0]?.contenidoTexto && (
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{calificando.submissions[0].contenidoTexto}</p>
                  )}
                  {calificando?.submissions?.[0]?.archivoUrl && (
                    <a href={calificando.submissions[0].archivoUrl} target="_blank" rel="noreferrer" className="text-xs text-[#3C3B6E] hover:underline inline-flex items-center gap-1">
                      <Download className="w-3 h-3" /> {t('lms.teacher.tasks.viewFile')}
                    </a>
                  )}
                  {calificando?.submissions?.[0]?.audioUrl && (
                    <a href={calificando.submissions[0].audioUrl} target="_blank" rel="noreferrer" className="text-xs text-[#3C3B6E] hover:underline inline-flex items-center gap-1">
                      <Download className="w-3 h-3" /> {t('lms.teacher.tasks.viewAudio')}
                    </a>
                  )}
                  <p className="text-[11px] text-slate-400">
                    {t('lms.teacher.tasks.submittedAt')}: {formatFechaHora(calificando.submissions[0].fechaEntrega, lang)}
                  </p>
                </>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t('lms.teacher.tasks.nota')} (0–100)</Label>
              <Input type="number" min={0} max={100} step={1} value={nota} onChange={(e) => setNota(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('lms.teacher.tasks.feedback')}</Label>
              <Textarea rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder={t('lms.teacher.tasks.feedbackPh')} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCalificando(null)}>{t('lms.cancelar')}</Button>
              <Button onClick={enviarNota} disabled={enviandoNota || !calificando?.submissions?.length}>
                {enviandoNota && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t('lms.calificar')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enlace a la vista del estudiante */}
      <p className="text-xs text-slate-400">
        <Link to="/estudiante/tareas" className="text-[#3C3B6E] hover:underline">{t('lms.teacher.tasks.studentView')}</Link>
      </p>
    </div>
  );
}
