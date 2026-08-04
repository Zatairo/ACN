import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, Video, Clock, RefreshCw, Loader2 } from 'lucide-react';
import { sessionsApi } from '@/api/lmsClient';
import { LmsPage, EstadoBadge, Spinner, EmptyState } from '@/components/lms/common';
import { formatFechaHora, etiqueta, SESION_ESTADO } from '@/lib/lms-formatters';
import { useI18n } from '@/lib/i18n/index.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

// ─────────────────────────────────────────────────────────────
// F2.B2 — Agenda del estudiante: próximas + historial, enlace de
// reunión y solicitud de reprogramación (queda pendiente de
// aprobación de la profesora).
// ─────────────────────────────────────────────────────────────

export default function EstudianteClases() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const [sessions, setSessions] = useState(null);
  const [solicitando, setSolicitando] = useState(null);
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nota, setNota] = useState('');
  const [enviando, setEnviando] = useState(false);

  const load = useCallback(async () => {
    try {
      setSessions(await sessionsApi.list());
    } catch {
      setSessions([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!sessions) return <Spinner />;

  const proximas = sessions
    .filter((s) => s.estado === 'SCHEDULED' || s.estado === 'RESCHEDULED')
    .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));
  const historial = sessions
    .filter((s) => !['SCHEDULED', 'RESCHEDULED'].includes(s.estado))
    .sort((a, b) => new Date(b.fechaHora) - new Date(a.fechaHora));

  const solicitarReprogramacion = async (session) => {
    setEnviando(true);
    try {
      await sessionsApi.update(session.id, {
        reprogramacionFechaHora: new Date(nuevaFecha).toISOString(),
        reprogramacionNota: nota || null,
      });
      toast({ title: t('lms.student.rescheduleOk'), description: t('lms.student.rescheduleOkDesc') });
      setSolicitando(null);
      setNuevaFecha('');
      setNota('');
      load();
    } catch (e) {
      toast({ title: t('lms.error'), description: e.message, variant: 'destructive' });
    } finally {
      setEnviando(false);
    }
  };

  const SesionRow = ({ s }) => (
    <div className="bg-white rounded-lg border border-slate-100 shadow-sm px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-slate-800 text-sm">{formatFechaHora(s.fechaHora, lang)}</p>
            <EstadoBadge estado={s.estado} label={etiqueta(SESION_ESTADO, s.estado, lang)} />
            {s.reprogramacionSolicitada && (
              <span className="text-[11px] font-medium text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full">
                {t('lms.student.reschedulePending')}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            {s.tema || t('lms.class')} · {s.duracionMin} min · {s.teacher?.nombre}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {s.enlaceVideo && (
            <a
              href={s.enlaceVideo}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#3C3B6E] text-white px-3 py-2 rounded-lg hover:bg-[#2e2d5a] transition-colors"
            >
              <Video className="w-3.5 h-3.5" /> {t('lms.student.join')}
            </a>
          )}
          {(s.estado === 'SCHEDULED' || s.estado === 'RESCHEDULED') && !s.reprogramacionSolicitada && (
            <Button variant="outline" size="sm" onClick={() => setSolicitando(s)}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> {t('lms.student.reschedule')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <LmsPage title={t('lms.student.agenda')} subtitle={t('lms.student.agendaSubtitle')} />

      <div>
        <h3 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-[#3C3B6E]" /> {t('lms.student.upcoming')}
        </h3>
        {proximas.length === 0 ? (
          <EmptyState icon={CalendarDays} title={t('lms.student.noUpcoming')} />
        ) : (
          <div className="space-y-2">{proximas.map((s) => <SesionRow key={s.id} s={s} />)}</div>
        )}
      </div>

      <div>
        <h3 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#3C3B6E]" /> {t('lms.student.history')}
        </h3>
        {historial.length === 0 ? (
          <EmptyState icon={Clock} title={t('lms.student.noHistory')} />
        ) : (
          <div className="space-y-2">{historial.map((s) => <SesionRow key={s.id} s={s} />)}</div>
        )}
      </div>

      {/* Diálogo de reprogramación */}
      <Dialog open={!!solicitando} onOpenChange={(open) => !open && setSolicitando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('lms.student.reschedule')}</DialogTitle>
            <DialogDescription>
              {t('lms.student.rescheduleDesc')}{' '}
              {solicitando && formatFechaHora(solicitando.fechaHora, lang)}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="nueva-fecha">{t('lms.student.newDateTime')}</Label>
              <Input
                id="nueva-fecha"
                type="datetime-local"
                value={nuevaFecha}
                onChange={(e) => setNuevaFecha(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nota-reprogramacion">{t('lms.student.reason')}</Label>
              <Input
                id="nota-reprogramacion"
                placeholder={t('lms.student.reasonPlaceholder')}
                value={nota}
                onChange={(e) => setNota(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSolicitando(null)}>{t('lms.cancelar')}</Button>
              <Button
                onClick={() => solicitarReprogramacion(solicitando)}
                disabled={!nuevaFecha || enviando}
              >
                {enviando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                {t('lms.student.sendRequest')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
