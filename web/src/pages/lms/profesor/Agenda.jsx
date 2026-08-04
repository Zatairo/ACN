import { useState, useEffect, useCallback } from 'react';
import { CalendarPlus, CheckCircle2, XCircle, Video, StickyNote, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { sessionsApi, dashboardApi } from '@/api/lmsClient';
import { LmsPage, EstadoBadge, Spinner, EmptyState, NivelBadge } from '@/components/lms/common';
import { formatFechaHora, SESION_ESTADO, etiqueta } from '@/lib/lms-formatters';
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
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────
// F2.C2 — Agenda del profesor: programar y editar sesiones,
// registrar asistencia, aprobar solicitudes de reprogramación
// de estudiantes y cancelar sesiones.
// ─────────────────────────────────────────────────────────────

export default function ProfesorAgenda() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const [sessions, setSessions] = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);
  const [filtro, setFiltro] = useState('TODO');
  const [editando, setEditando] = useState(null); // sesión en diálogo
  const [creando, setCreando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const load = useCallback(async () => {
    try {
      const [ses, dash] = await Promise.all([sessionsApi.list(), dashboardApi.me()]);
      setSessions(ses);
      setEstudiantes(dash.estudiantes ?? []);
    } catch {
      setSessions([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!sessions) return <Spinner />;

  const visibles = filtro === 'TODO' ? sessions : sessions.filter((s) => s.estado === filtro);
  const solicitudes = sessions.filter((s) => s.reprogramacionSolicitada);

  // ── Guardar creación o edición ──
  const guardar = async () => {
    setGuardando(true);
    try {
      if (creando) {
        await sessionsApi.create({
          enrollmentId: editando.enrollmentId,
          fechaHora: new Date(editando.fechaHora).toISOString(),
          duracionMin: editando.duracionMin ?? 45,
          enlaceVideo: editando.enlaceVideo || null,
          tema: editando.tema || null,
          notasClase: editando.notasClase || null,
        });
        toast({ title: t('lms.teacher.agenda.created') });
      } else {
        await sessionsApi.update(editando.id, {
          ...(editando.fechaHora ? { fechaHora: new Date(editando.fechaHora).toISOString() } : {}),
          ...(editando.duracionMin ? { duracionMin: editando.duracionMin } : {}),
          enlaceVideo: editando.enlaceVideo || null,
          tema: editando.tema || null,
          notasClase: editando.notasClase || null,
        });
        toast({ title: t('lms.teacher.agenda.updated') });
      }
      setEditando(null);
      setCreando(false);
      load();
    } catch (err) {
      toast({ title: t('lms.error'), description: err.message, variant: 'destructive' });
    } finally {
      setGuardando(false);
    }
  };

  // ── Asistencia: completar con asistencia o inasistencia ──
  const marcarAsistencia = async (s, asistio) => {
    try {
      await sessionsApi.update(s.id, { estado: 'COMPLETED', asistio });
      toast({ title: asistio ? t('lms.teacher.agenda.asistio') : t('lms.teacher.agenda.noAsistio') });
      load();
    } catch (err) {
      toast({ title: t('lms.error'), description: err.message, variant: 'destructive' });
    }
  };

  const cancelar = async (id) => {
    try {
      await sessionsApi.cancel(id);
      toast({ title: t('lms.teacher.agenda.cancelled') });
      load();
    } catch (err) {
      toast({ title: t('lms.error'), description: err.message, variant: 'destructive' });
    }
  };

  // ── Aprobar solicitud de reprogramación ──
  const aprobarReprogramacion = async (s) => {
    try {
      await sessionsApi.update(s.id, { aprobarReprogramacion: true });
      toast({ title: t('lms.teacher.agenda.rescheduleApproved') });
      load();
    } catch (err) {
      toast({ title: t('lms.error'), description: err.message, variant: 'destructive' });
    }
  };

  const nuevoForm = () => ({
    enrollmentId: estudiantes[0]?.enrollmentId ?? '',
    fechaHora: '',
    duracionMin: 45,
    enlaceVideo: '',
    tema: '',
    notasClase: '',
  });

  return (
    <div className="space-y-6">
      <LmsPage
        title={t('lms.teacher.agenda.title')}
        subtitle={t('lms.teacher.agenda.subtitle')}
        actions={
          <Button
            onClick={() => {
              setCreando(true);
              setEditando(nuevoForm());
            }}
            disabled={estudiantes.length === 0}
          >
            <CalendarPlus className="w-4 h-4 mr-2" /> {t('lms.teacher.agenda.new')}
          </Button>
        }
      />

      {/* Solicitudes de reprogramación */}
      {solicitudes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {t('lms.teacher.agenda.pendingRequests')}
          </p>
          {solicitudes.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-lg px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">{s.enrollment?.student?.nombre}</p>
                <p className="text-xs text-slate-500">
                  {t('lms.teacher.agenda.from')} {formatFechaHora(s.fechaHora, lang)} →{' '}
                  <span className="font-semibold text-amber-700">{formatFechaHora(s.reprogramacionFechaHora, lang)}</span>
                  {s.reprogramacionNota && <span> — {s.reprogramacionNota}</span>}
                </p>
              </div>
              <Button size="sm" onClick={() => aprobarReprogramacion(s)}>
                {t('lms.teacher.agenda.approve')}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {['TODO', 'SCHEDULED', 'RESCHEDULED', 'COMPLETED', 'NO_SHOW', 'CANCELLED'].map((e) => (
          <button
            key={e}
            onClick={() => setFiltro(e)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors',
              filtro === e
                ? 'bg-[#3C3B6E] text-white border-[#3C3B6E]'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
            )}
          >
            {e === 'TODO' ? t('lms.todos') : etiqueta(SESION_ESTADO, e, lang)}
          </button>
        ))}
      </div>

      {/* Lista */}
      {visibles.length === 0 ? (
        <EmptyState icon={CalendarPlus} title={t('lms.teacher.agenda.empty')} />
      ) : (
        <div className="space-y-2">
          {visibles.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-slate-800">{s.enrollment?.student?.nombre}</p>
                  <EstadoBadge estado={s.estado} label={etiqueta(SESION_ESTADO, s.estado, lang)} />
                  {s.reprogramacionSolicitada && (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      {t('lms.teacher.agenda.reschedulePending')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{formatFechaHora(s.fechaHora, lang)} · {s.duracionMin} min</p>
                {s.tema && <p className="text-xs text-slate-600 mt-0.5">{t('lms.teacher.agenda.tema')}: {s.tema}</p>}
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {s.enlaceVideo && (
                    <a href={s.enlaceVideo} target="_blank" rel="noreferrer" className="text-[11px] text-[#3C3B6E] hover:underline inline-flex items-center gap-1">
                      <Video className="w-3 h-3" /> {t('lms.teacher.agenda.link')} <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                  {s.notasClase && (
                    <span className="text-[11px] text-slate-400 inline-flex items-center gap-1">
                      <StickyNote className="w-3 h-3" /> {s.notasClase}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {s.estado === 'SCHEDULED' || s.estado === 'RESCHEDULED' ? (
                  <>
                    <Button size="sm" variant="outline" onClick={() => marcarAsistencia(s, true)} title={t('lms.teacher.agenda.asistio')}>
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => marcarAsistencia(s, false)} title={t('lms.teacher.agenda.noAsistio')}>
                      <XCircle className="w-3.5 h-3.5 text-amber-600" />
                    </Button>
                  </>
                ) : null}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setCreando(false);
                    setEditando({ ...s, fechaHora: s.fechaHora?.slice(0, 16) });
                  }}
                >
                  {t('lms.editar')}
                </Button>
                {s.estado === 'SCHEDULED' || s.estado === 'RESCHEDULED' ? (
                  <Button size="sm" variant="outline" onClick={() => cancelar(s.id)}>
                    {t('lms.cancelar')}
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Diálogo crear/editar */}
      <Dialog open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{creando ? t('lms.teacher.agenda.new') : t('lms.teacher.agenda.edit')}</DialogTitle>
            <DialogDescription>{t('lms.teacher.agenda.editDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {creando ? (
              <div className="space-y-2">
                <Label>{t('lms.teacher.agenda.student')}</Label>
                <Select
                  value={String(editando.enrollmentId ?? '')}
                  onValueChange={(v) => setEditando((f) => ({ ...f, enrollmentId: Number(v) }))}
                >
                  <SelectTrigger><SelectValue placeholder={t('lms.teacher.agenda.selectStudent')} /></SelectTrigger>
                  <SelectContent>
                    {estudiantes
                      .filter((e) => e.enrollmentId)
                      .map((e) => (
                        <SelectItem key={e.id} value={String(e.enrollmentId)}>
                          {e.nombre} {e.nivelMCER && <NivelBadge nivel={e.nivelMCER} />}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="space-y-2">
              <Label>{t('lms.teacher.agenda.dateTime')}</Label>
              <Input
                type="datetime-local"
                value={editando.fechaHora ?? ''}
                onChange={(e) => setEditando((f) => ({ ...f, fechaHora: e.target.value }))}
              />
            </div>
            {!creando && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t('lms.teacher.agenda.duration')}</Label>
                  <Input
                    type="number"
                    min={15}
                    value={editando.duracionMin ?? 45}
                    onChange={(e) => setEditando((f) => ({ ...f, duracionMin: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('lms.teacher.agenda.videoLink')}</Label>
                  <Input
                    value={editando.enlaceVideo ?? ''}
                    onChange={(e) => setEditando((f) => ({ ...f, enlaceVideo: e.target.value }))}
                    placeholder="https://meet.google.com/..."
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>{t('lms.teacher.agenda.tema')}</Label>
              <Input
                value={editando.tema ?? ''}
                onChange={(e) => setEditando((f) => ({ ...f, tema: e.target.value }))}
                placeholder={t('lms.teacher.agenda.temaPh')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('lms.teacher.agenda.notes')}</Label>
              <Textarea
                rows={2}
                value={editando.notasClase ?? ''}
                onChange={(e) => setEditando((f) => ({ ...f, notasClase: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditando(null)}>{t('lms.cancelar')}</Button>
              <Button onClick={guardar} disabled={guardando || !editando.enrollmentId || !editando.fechaHora}>
                {guardando && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t('lms.guardar')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
