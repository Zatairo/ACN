import { useState, useEffect, useCallback } from 'react';
import { BookOpen, Layers, Package, Plus, Loader2, Pencil } from 'lucide-react';
import { coursesApi, packagesApi } from '@/api/lmsClient';
import { LmsPage, EstadoBadge, Spinner, EmptyState, NivelBadge } from '@/components/lms/common';
import { formatCOP, CURSO_ESTADO, PAQUETE_ESTADO, etiqueta, MODULO_TIPO } from '@/lib/lms-formatters';
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
// F2.D3 — Catálogo: cursos con módulos (nivel MCER) y paquetes
// comerciales (precios COP desde Services- Andres.docx).
// ─────────────────────────────────────────────────────────────

export default function AdminCursos() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const [cursos, setCursos] = useState(null);
  const [paquetes, setPaquetes] = useState([]);
  const [detalle, setDetalle] = useState(null); // curso con módulos
  const [dialogo, setDialogo] = useState(null); // { tipo: 'curso'|'modulo'|'paquete', dato }
  const [guardando, setGuardando] = useState(false);

  const load = useCallback(async () => {
    try {
      const [cs, ps] = await Promise.all([coursesApi.list(), packagesApi.list()]);
      setCursos(cs);
      setPaquetes(ps);
    } catch {
      setCursos([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const abrirDetalle = async (id) => {
    try {
      setDetalle(await coursesApi.get(id));
    } catch (err) {
      toast({ title: t('lms.error'), description: err.message, variant: 'destructive' });
    }
  };

  if (!cursos) return <Spinner />;

  const guardarCurso = async (form) => {
    setGuardando(true);
    try {
      if (form.id) await coursesApi.update(form.id, form);
      else await coursesApi.create(form);
      toast({ title: t('lms.admin.cursos.saved') });
      setDialogo(null);
      load();
      if (detalle) setDetalle(null);
    } catch (err) {
      toast({ title: t('lms.error'), description: err.message, variant: 'destructive' });
    } finally {
      setGuardando(false);
    }
  };

  const guardarModulo = async (form) => {
    setGuardando(true);
    try {
      await coursesApi.createModule(form.courseId, form);
      toast({ title: t('lms.admin.cursos.moduleSaved') });
      setDialogo(null);
      abrirDetalle(form.courseId);
    } catch (err) {
      toast({ title: t('lms.error'), description: err.message, variant: 'destructive' });
    } finally {
      setGuardando(false);
    }
  };

  const guardarPaquete = async (form) => {
    setGuardando(true);
    try {
      await packagesApi.update(form.id, form);
      toast({ title: t('lms.admin.cursos.packageSaved') });
      setDialogo(null);
      load();
    } catch (err) {
      toast({ title: t('lms.error'), description: err.message, variant: 'destructive' });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6">
      <LmsPage
        title={t('lms.admin.cursos.title')}
        subtitle={t('lms.admin.cursos.subtitle')}
        actions={
          <Button onClick={() => setDialogo({ tipo: 'curso', dato: { titulo: '', nivelMCER: 'B1', descripcion: '', modalidad: 'ZOOM', estado: 'DRAFT' } })}>
            <Plus className="w-4 h-4 mr-2" /> {t('lms.admin.cursos.newCourse')}
          </Button>
        }
      />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Cursos */}
        <div>
          <h3 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#3C3B6E]" /> {t('lms.admin.cursos.courses')}
          </h3>
          {cursos.length === 0 ? (
            <EmptyState icon={BookOpen} title={t('lms.admin.cursos.empty')} />
          ) : (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm divide-y divide-slate-50">
              {cursos.map((c) => (
                <div key={c.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <button onClick={() => abrirDetalle(c.id)} className="text-sm font-semibold text-slate-800 hover:text-[#3C3B6E] text-left">
                      {c.titulo} <NivelBadge nivel={c.nivelMCER} />
                    </button>
                    <Button size="sm" variant="outline" onClick={() => setDialogo({ tipo: 'curso', dato: { ...c } })}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {c.teacher?.nombre} · {c._count?.modules ?? 0} {t('lms.admin.cursos.modules')} · {c._count?.enrollments ?? 0} {t('lms.admin.cursos.matriculas')}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <EstadoBadge estado={c.estado} label={etiqueta(CURSO_ESTADO, c.estado, lang)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Paquetes */}
        <div>
          <h3 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <Package className="w-4 h-4 text-[#3C3B6E]" /> {t('lms.admin.cursos.packages')}
          </h3>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm divide-y divide-slate-50">
            {paquetes.map((p) => (
              <div key={p.id} className="px-4 py-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{p.nombre}</p>
                  <p className="text-xs text-slate-400">{p.sesionesIncluidas} {t('lms.admin.cursos.sesiones')} · {formatCOP(p.precioCOP)}</p>
                  <EstadoBadge estado={p.estado} label={etiqueta(PAQUETE_ESTADO, p.estado, lang)} />
                </div>
                <Button size="sm" variant="outline" onClick={() => setDialogo({ tipo: 'paquete', dato: { ...p } })}>
                  <Pencil className="w-3 h-3" />
                </Button>
              </div>
            ))}
            {paquetes.length === 0 && (
              <div className="p-4"><p className="text-sm text-slate-400">{t('lms.admin.cursos.noPackages')}</p></div>
            )}
          </div>
        </div>
      </div>

      {/* Detalle del curso: módulos */}
      {detalle && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#3C3B6E]" /> {detalle.titulo} · {t('lms.admin.cursos.modules')}
            </h3>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setDialogo({ tipo: 'modulo', dato: { courseId: detalle.id, orden: (detalle.modules?.length ?? 0), titulo: '', descripcion: '', estado: 'ACTIVE' } })}>
                <Plus className="w-3 h-3 mr-1" /> {t('lms.admin.cursos.newModule')}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setDetalle(null)}>{t('lms.cerrar')}</Button>
            </div>
          </div>
          {detalle.modules?.length === 0 ? (
            <p className="text-sm text-slate-400">{t('lms.admin.cursos.noModules')}</p>
          ) : (
            <div className="space-y-2">
              {detalle.modules.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-2 bg-slate-50 rounded-lg px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700">{m.orden + 1}. {m.titulo}</p>
                    {m.descripcion && <p className="text-xs text-slate-400 truncate">{m.descripcion}</p>}
                  </div>
                  <span className="text-[10px] font-semibold bg-[#3C3B6E]/10 text-[#3C3B6E] px-2 py-0.5 rounded-full shrink-0">
                    {etiqueta(MODULO_TIPO, m.estado ?? 'GRAMMAR', lang)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Diálogos */}
      <Dialog open={!!dialogo} onOpenChange={(o) => !o && setDialogo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogo?.tipo === 'curso' && (dialogo.dato?.id ? t('lms.admin.cursos.editCourse') : t('lms.admin.cursos.newCourse'))}
              {dialogo?.tipo === 'modulo' && t('lms.admin.cursos.newModule')}
              {dialogo?.tipo === 'paquete' && t('lms.admin.cursos.editPackage')}
            </DialogTitle>
            <DialogDescription>{t('lms.admin.cursos.dialogDesc')}</DialogDescription>
          </DialogHeader>

          {dialogo?.tipo === 'curso' && (
            <CursoForm key={dialogo.dato?.id ?? 'nuevo'} dato={dialogo.dato} guardando={guardando} onGuardar={guardarCurso} onCancelar={() => setDialogo(null)} />
          )}
          {dialogo?.tipo === 'modulo' && (
            <ModuloForm key={dialogo.dato.courseId} dato={dialogo.dato} guardando={guardando} onGuardar={guardarModulo} onCancelar={() => setDialogo(null)} />
          )}
          {dialogo?.tipo === 'paquete' && (
            <PaqueteForm key={dialogo.dato.id} dato={dialogo.dato} guardando={guardando} onGuardar={guardarPaquete} onCancelar={() => setDialogo(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Formularios ──

function CursoForm({ dato, guardando, onGuardar, onCancelar }) {
  const { t, lang } = useI18n();
  const [form, setForm] = useState(dato);
  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-2">
        <Label>{t('lms.admin.cursos.titulo')}</Label>
        <Input value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Nivel MCER</Label>
          <Select value={form.nivelMCER} onValueChange={(v) => setForm((f) => ({ ...f, nivelMCER: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {['A1', 'A2', 'B1', 'B2', 'C1'].map((n) => (
                <SelectItem key={n} value={n}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t('lms.admin.cursos.modalidad')}</Label>
          <Select value={form.modalidad} onValueChange={(v) => setForm((f) => ({ ...f, modalidad: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ZOOM">Zoom</SelectItem>
              <SelectItem value="MEET">Google Meet</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>{t('lms.admin.cursos.descripcion')}</Label>
        <Textarea rows={2} value={form.descripcion ?? ''} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} />
      </div>
      <div className="space-y-2">
        <Label>{t('lms.admin.users.estado')}</Label>
        <Select value={form.estado} onValueChange={(v) => setForm((f) => ({ ...f, estado: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.keys(CURSO_ESTADO).map((e) => (
              <SelectItem key={e} value={e}>{etiqueta(CURSO_ESTADO, e, lang)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancelar}>{t('lms.cancelar')}</Button>
        <Button onClick={() => onGuardar(form)} disabled={guardando || !form.titulo.trim()}>
          {guardando && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {t('lms.guardar')}
        </Button>
      </div>
    </div>
  );
}

function ModuloForm({ dato, guardando, onGuardar, onCancelar }) {
  const { t, lang } = useI18n();
  const [form, setForm] = useState(dato);
  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-2">
        <Label>{t('lms.admin.cursos.moduleTitle')}</Label>
        <Input value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>{t('lms.admin.cursos.orden')}</Label>
          <Input type="number" min={0} value={form.orden} onChange={(e) => setForm((f) => ({ ...f, orden: Number(e.target.value) }))} />
        </div>
        <div className="space-y-2">
          <Label>{t('lms.admin.cursos.tipo')}</Label>
          <Select value={form.estado ?? 'GRAMMAR'} onValueChange={(v) => setForm((f) => ({ ...f, estado: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.keys(MODULO_TIPO).map((k) => (
                <SelectItem key={k} value={k}>{etiqueta(MODULO_TIPO, k, lang)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>{t('lms.admin.cursos.descripcion')}</Label>
        <Textarea rows={2} value={form.descripcion ?? ''} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancelar}>{t('lms.cancelar')}</Button>
        <Button onClick={() => onGuardar(form)} disabled={guardando || !form.titulo.trim()}>
          {guardando && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {t('lms.guardar')}
        </Button>
      </div>
    </div>
  );
}

function PaqueteForm({ dato, guardando, onGuardar, onCancelar }) {
  const { t, lang } = useI18n();
  const [form, setForm] = useState(dato);
  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-2">
        <Label>{t('lms.admin.cursos.packageName')}</Label>
        <Input value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>{t('lms.admin.cursos.sesiones')}</Label>
          <Input type="number" min={1} value={form.sesionesIncluidas} onChange={(e) => setForm((f) => ({ ...f, sesionesIncluidas: Number(e.target.value) }))} />
        </div>
        <div className="space-y-2">
          <Label>{t('lms.payment.price')} (COP)</Label>
          <Input type="number" min={0} value={form.precioCOP} onChange={(e) => setForm((f) => ({ ...f, precioCOP: Number(e.target.value) }))} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>{t('lms.admin.users.estado')}</Label>
        <Select value={form.estado} onValueChange={(v) => setForm((f) => ({ ...f, estado: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.keys(PAQUETE_ESTADO).map((e) => (
              <SelectItem key={e} value={e}>{etiqueta(PAQUETE_ESTADO, e, lang)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancelar}>{t('lms.cancelar')}</Button>
        <Button onClick={() => onGuardar(form)} disabled={guardando || !form.nombre.trim()}>
          {guardando && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {t('lms.guardar')}
        </Button>
      </div>
    </div>
  );
}
