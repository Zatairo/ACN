import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, Loader2, Paperclip, Award } from 'lucide-react';
import { tasksApi, uploadFile } from '@/api/lmsClient';
import { EstadoBadge, Spinner, Nota } from '@/components/lms/common';
import { formatFechaHora, etiqueta, TAREA_ESTADO, TAREA_TIPO } from '@/lib/lms-formatters';
import { useI18n } from '@/lib/i18n/index.jsx';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// ─────────────────────────────────────────────────────────────
// F2.B3 — Detalle de tarea del estudiante: entrega por texto o
// archivo/audio (upload multipart) y vista de nota + feedback.
// ─────────────────────────────────────────────────────────────

export default function EstudianteTareaDetalle() {
  const { id } = useParams();
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const [task, setTask] = useState(null);
  const [contenido, setContenido] = useState('');
  const [archivoUrl, setArchivoUrl] = useState('');
  const [archivoNombre, setArchivoNombre] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const load = useCallback(async () => {
    try {
      setTask(await tasksApi.get(id));
    } catch {
      setTask(null);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!task) return <Spinner />;

  const puedeEntregar = task.estado === 'ASSIGNED' || task.estado === 'SUBMITTED';
  const ultimaEntrega = task.submissions?.[0];
  const calificacion = ultimaEntrega?.grades?.[0];

  const subirArchivo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendo(true);
    try {
      const up = await uploadFile(file);
      setArchivoUrl(up.url);
      setArchivoNombre(up.nombre);
      toast({ title: t('lms.uploadOk'), description: up.nombre });
    } catch (err) {
      toast({ title: t('lms.error'), description: err.message, variant: 'destructive' });
    } finally {
      setSubiendo(false);
      e.target.value = '';
    }
  };

  const entregar = async () => {
    if (!contenido.trim() && !archivoUrl) {
      toast({ title: t('lms.error'), description: t('lms.task.needContent'), variant: 'destructive' });
      return;
    }
    setEnviando(true);
    try {
      await tasksApi.submit(task.id, {
        contenidoTexto: contenido.trim() || null,
        archivoUrl: archivoUrl || null,
      });
      toast({ title: t('lms.task.submittedOk') });
      load();
    } catch (err) {
      toast({ title: t('lms.error'), description: err.message, variant: 'destructive' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Link to="/estudiante/tareas" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[#3C3B6E]">
        <ArrowLeft className="w-3.5 h-3.5" /> {t('lms.back')}
      </Link>

      {/* Encabezado de la tarea */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
            {etiqueta(TAREA_TIPO, task.tipo, lang)}
          </span>
          <EstadoBadge estado={task.estado} label={etiqueta(TAREA_ESTADO, task.estado, lang)} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mt-1">{task.titulo}</h2>
        <p className="text-sm text-slate-500 mt-1">
          {t('lms.task.due')}: {task.fechaLimite ? formatFechaHora(task.fechaLimite, lang) : '—'} · {task.nivelMCER}
        </p>
        {task.descripcion && (
          <p className="text-sm text-slate-600 mt-3 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">{task.descripcion}</p>
        )}
        {task.audioUrl && (
          <audio controls src={task.audioUrl} className="mt-3 w-full" preload="none" />
        )}
      </div>

      {/* Calificación (si existe) */}
      {calificacion && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <Award className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-800">
                {t('lms.task.grade')}: <Nota nota={calificacion.nota} />
              </p>
              <p className="text-[11px] text-green-700/70">
                {t('lms.task.gradedBy')} {task.teacher?.nombre} · {formatFechaHora(calificacion.fechaEvaluacion, lang)}
              </p>
            </div>
          </div>
          {calificacion.feedback && (
            <p className="text-sm text-green-900 mt-3 bg-white/60 rounded-lg p-3">{calificacion.feedback}</p>
          )}
          {calificacion.rubricaJson && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(calificacion.rubricaJson)
                .filter(([k]) => k !== 'total')
                .map(([k, v]) => (
                  <div key={k} className="bg-white rounded-lg p-2 text-center">
                    <p className="text-[10px] text-slate-500 uppercase">{k.replace(/([A-Z])/g, ' $1')}</p>
                    <p className="font-bold text-green-700 text-sm">{v}</p>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Entrega */}
      {puedeEntregar && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold text-slate-700 mb-3">{t('lms.task.submitWork')}</h3>
          {ultimaEntrega && (
            <p className="text-xs text-slate-500 mb-3">
              {t('lms.task.previousSubmission')}: {formatFechaHora(ultimaEntrega.fechaEntrega, lang)}
            </p>
          )}
          <Tabs defaultValue="texto">
            <TabsList>
              <TabsTrigger value="texto">{t('lms.task.byText')}</TabsTrigger>
              <TabsTrigger value="archivo">{t('lms.task.byFile')}</TabsTrigger>
            </TabsList>
            <TabsContent value="texto" className="mt-3">
              <Textarea
                rows={7}
                placeholder={t('lms.task.textPlaceholder')}
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
              />
            </TabsContent>
            <TabsContent value="archivo" className="mt-3">
              <div className="rounded-lg border-2 border-dashed border-slate-200 p-6 text-center">
                <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">{t('lms.task.dropFile')}</p>
                <p className="text-[11px] text-slate-400 mt-1">PDF, imagen, audio · máx. 10 MB</p>
                <label className="mt-3 inline-flex">
                  <input type="file" className="hidden" onChange={subirArchivo} accept=".png,.jpg,.jpeg,.pdf,.doc,.docx,.mp3,.m4a,.wav,.txt" />
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#3C3B6E] text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-[#2e2d5a]">
                    {subiendo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
                    {t('lms.task.chooseFile')}
                  </span>
                </label>
                {archivoNombre && (
                  <p className="text-xs text-green-600 mt-2 flex items-center justify-center gap-1">
                    <Paperclip className="w-3 h-3" /> {archivoNombre}
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
          <div className="mt-4 flex justify-end">
            <Button onClick={entregar} disabled={enviando || subiendo}>
              {enviando && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {ultimaEntrega ? t('lms.task.resubmit') : t('lms.task.submit')}
            </Button>
          </div>
        </div>
      )}

      {ultimaEntrega && (
        <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">
          <p className="font-medium text-slate-700 mb-1">{t('lms.task.yourSubmission')}</p>
          {ultimaEntrega.contenidoTexto && <p className="whitespace-pre-wrap">{ultimaEntrega.contenidoTexto}</p>}
          {ultimaEntrega.archivoUrl && (
            <a href={ultimaEntrega.archivoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#3C3B6E] font-medium mt-2 hover:underline">
              <Paperclip className="w-3.5 h-3.5" /> {t('lms.task.viewFile')}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
