import { useState, useEffect, useCallback } from 'react';
import { FolderOpen, Upload, Loader2, Link2, FileText, Trash2, Headphones, Video, File } from 'lucide-react';
import { resourcesApi, coursesApi, uploadFile } from '@/api/lmsClient';
import { LmsPage, Spinner, EmptyState } from '@/components/lms/common';
import { formatFecha } from '@/lib/lms-formatters';
import { useI18n } from '@/lib/i18n/index.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────
// F2.C5 — Materiales del profesor: publicar PDF/audio/video/link
// para un curso y administrar el repositorio por curso.
// ─────────────────────────────────────────────────────────────

const ICONOS = {
  PDF: FileText,
  LINK: Link2,
  AUDIO: Headphones,
  VIDEO: Video,
  DOC: File,
};

export default function ProfesorMateriales() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const [recursos, setRecursos] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [cursoFiltro, setCursoFiltro] = useState('TODOS');
  const [creando, setCreando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [form, setForm] = useState({ tipo: 'PDF', titulo: '', url: '' });

  const load = useCallback(async () => {
    try {
      const [rs, cs] = await Promise.all([resourcesApi.list(), coursesApi.list()]);
      setRecursos(rs);
      setCursos(cs);
    } catch {
      setRecursos([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!recursos) return <Spinner />;

  const visibles = cursoFiltro === 'TODOS' ? recursos : recursos.filter((r) => r.courseId === Number(cursoFiltro));

  const subirArchivo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendo(true);
    try {
      const up = await uploadFile(file);
      const ext = file.name.split('.').pop()?.toUpperCase();
      setForm((f) => ({
        ...f,
        url: up.url,
        titulo: file.name.replace(/\.[^.]+$/, ''),
        tipo: ext === 'MP3' || ext === 'WAV' ? 'AUDIO' : ext === 'MP4' || ext === 'WEBM' ? 'VIDEO' : ext === 'PDF' ? 'PDF' : 'DOC',
      }));
      toast({ title: t('lms.uploadOk') });
    } catch (err) {
      toast({ title: t('lms.error'), description: err.message, variant: 'destructive' });
    } finally {
      setSubiendo(false);
      e.target.value = '';
    }
  };

  const crear = async () => {
    if (!form.courseId || !form.titulo.trim() || !form.url.trim()) {
      toast({ title: t('lms.error'), description: t('lms.payment.requiredFields'), variant: 'destructive' });
      return;
    }
    setGuardando(true);
    try {
      await resourcesApi.create({
        courseId: Number(form.courseId),
        tipo: form.tipo,
        titulo: form.titulo.trim(),
        url: form.url.trim(),
      });
      toast({ title: t('lms.teacher.materials.created') });
      setCreando(false);
      setForm({ tipo: 'PDF', titulo: '', url: '' });
      load();
    } catch (err) {
      toast({ title: t('lms.error'), description: err.message, variant: 'destructive' });
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id) => {
    try {
      await resourcesApi.remove(id);
      toast({ title: t('lms.teacher.materials.deleted') });
      load();
    } catch (err) {
      toast({ title: t('lms.error'), description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <LmsPage
        title={t('lms.teacher.materials.title')}
        subtitle={t('lms.teacher.materials.subtitle')}
        actions={
          <Button onClick={() => setCreando(true)} disabled={cursos.length === 0}>
            <Upload className="w-4 h-4 mr-2" /> {t('lms.teacher.materials.new')}
          </Button>
        }
      />

      {/* Filtro por curso */}
      <Select value={cursoFiltro} onValueChange={setCursoFiltro}>
        <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="TODOS">{t('lms.todos')}</SelectItem>
          {cursos.map((c) => (
            <SelectItem key={c.id} value={String(c.id)}>{c.titulo} ({c.nivelMCER})</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {visibles.length === 0 ? (
        <EmptyState icon={FolderOpen} title={t('lms.teacher.materials.empty')} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visibles.map((r) => {
            const Icon = ICONOS[r.tipo] ?? File;
            return (
              <div key={r.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <span className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                    r.tipo === 'PDF' && 'bg-red-50 text-red-600',
                    r.tipo === 'AUDIO' && 'bg-purple-50 text-purple-600',
                    r.tipo === 'VIDEO' && 'bg-blue-50 text-blue-600',
                    r.tipo === 'LINK' && 'bg-green-50 text-green-600',
                    r.tipo === 'DOC' && 'bg-amber-50 text-amber-600',
                  )}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <button onClick={() => eliminar(r.id)} className="text-slate-300 hover:text-[#B22234] transition-colors" title={t('lms.eliminar')}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="min-w-0">
                  <a href={r.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-slate-800 hover:text-[#3C3B6E] line-clamp-2">
                    {r.titulo}
                  </a>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {r.tipo} · {r.uploader?.nombre} · {formatFecha(r.createdAt, lang)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Crear material */}
      <Dialog open={creando} onOpenChange={(o) => !o && setCreando(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('lms.teacher.materials.new')}</DialogTitle>
            <DialogDescription>{t('lms.teacher.materials.newDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>{t('lms.teacher.materials.course')}</Label>
              <Select value={form.courseId} onValueChange={(v) => setForm((f) => ({ ...f, courseId: v }))}>
                <SelectTrigger><SelectValue placeholder={t('lms.teacher.tasks.selectCourse')} /></SelectTrigger>
                <SelectContent>
                  {cursos.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.titulo} ({c.nivelMCER})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('lms.teacher.materials.uploadFile')}</Label>
              <div className="rounded-lg border-2 border-dashed border-slate-200 p-4 text-center">
                <input type="file" id="material" className="hidden" onChange={subirArchivo} accept=".pdf,.doc,.docx,.mp3,.wav,.mp4,.webm,.png,.jpg" />
                <label htmlFor="material" className="inline-flex items-center gap-1.5 text-xs font-semibold bg-slate-100 text-slate-700 px-4 py-2 rounded-lg cursor-pointer hover:bg-slate-200">
                  {subiendo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {t('lms.teacher.materials.chooseFile')}
                </label>
                {form.url && <p className="text-xs text-green-600 mt-2">{form.titulo}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t('lms.teacher.materials.type')}</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(ICONOS).map((k) => (
                      <SelectItem key={k} value={k}>{k}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('lms.teacher.materials.title')}</Label>
                <Input value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('lms.teacher.materials.url')}</Label>
              <Input value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreando(false)}>{t('lms.cancelar')}</Button>
              <Button onClick={crear} disabled={guardando || subiendo}>
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
