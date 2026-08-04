import { useState, useEffect, useCallback } from 'react';
import { Target, UserPlus, Loader2, ChevronRight, Trash2 } from 'lucide-react';
import { leadsApi } from '@/api/lmsClient';
import { LmsPage, Spinner, StatCard } from '@/components/lms/common';
import { formatFecha, LEAD_ESTADO, LEAD_CANAL, etiqueta } from '@/lib/lms-formatters';
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
// F2.D6 — CRM de leads: pipeline visual NUEVO → CONTACTADO →
// DIAGNOSTICO → OFERTA → CERRADO/PERDIDO, con WhatsApp directo.
// ─────────────────────────────────────────────────────────────

const ETAPAS = ['NUEVO', 'CONTACTADO', 'DIAGNOSTICO', 'OFERTA'];

export default function AdminCrm() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const [leads, setLeads] = useState(null);
  const [creando, setCreando] = useState(false);
  const [form, setForm] = useState({ nombre: '', telefonoWhatsApp: '', canal: 'WEB', nivelEstimado: '', notas: '' });
  const [guardando, setGuardando] = useState(false);

  const load = useCallback(async () => {
    try {
      setLeads(await leadsApi.list());
    } catch {
      setLeads([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!leads) return <Spinner />;

  const crear = async () => {
    if (!form.nombre.trim()) return;
    setGuardando(true);
    try {
      await leadsApi.create({
        nombre: form.nombre.trim(),
        telefonoWhatsApp: form.telefonoWhatsApp || null,
        canal: form.canal,
        nivelEstimado: form.nivelEstimado || null,
        notas: form.notas || null,
      });
      toast({ title: t('lms.admin.crm.created') });
      setCreando(false);
      setForm({ nombre: '', telefonoWhatsApp: '', canal: 'WEB', nivelEstimado: '', notas: '' });
      load();
    } catch (err) {
      toast({ title: t('lms.error'), description: err.message, variant: 'destructive' });
    } finally {
      setGuardando(false);
    }
  };

  const mover = async (id, estado) => {
    try {
      await leadsApi.update(id, { estado });
      load();
    } catch (err) {
      toast({ title: t('lms.error'), description: err.message, variant: 'destructive' });
    }
  };

  const totales = ETAPAS.reduce((acc, e) => ({ ...acc, [e]: leads.filter((l) => l.estado === e).length }), {});

  return (
    <div className="space-y-6">
      <LmsPage
        title={t('lms.admin.crm.title')}
        subtitle={t('lms.admin.crm.subtitle')}
        actions={
          <Button onClick={() => setCreando(true)}>
            <UserPlus className="w-4 h-4 mr-2" /> {t('lms.admin.crm.newLead')}
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {ETAPAS.map((e) => (
          <StatCard key={e} label={etiqueta(LEAD_ESTADO, e, lang)} value={totales[e] ?? 0} icon={Target} color="text-[#3C3B6E]" />
        ))}
      </div>

      {/* Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {ETAPAS.map((etapa) => (
          <div key={etapa} className="bg-slate-50 rounded-xl p-3 min-h-[200px]">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3 text-center">
              {etiqueta(LEAD_ESTADO, etapa, lang)}
            </p>
            <div className="space-y-2">
              {leads.filter((l) => l.estado === etapa).map((l) => (
                <div key={l.id} className="bg-white rounded-lg shadow-sm border border-slate-100 p-3 space-y-2">
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-sm font-semibold text-slate-800">{l.nombre}</p>
                    <button onClick={() => mover(l.id, 'PERDIDO')} className="text-slate-300 hover:text-[#B22234]" title={t('lms.admin.crm.markLost')}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-semibold bg-[#3C3B6E]/10 text-[#3C3B6E] px-1.5 py-0.5 rounded-full">
                      {etiqueta(LEAD_CANAL, l.canal, lang)}
                    </span>
                    {l.nivelEstimado && (
                      <span className="text-[10px] font-semibold bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">{l.nivelEstimado}</span>
                    )}
                  </div>
                  {l.notas && <p className="text-[11px] text-slate-500 line-clamp-2">{l.notas}</p>}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400">{formatFecha(l.fecha, lang)}</span>
                    <div className="flex items-center gap-1">
                      {l.telefonoWhatsApp && (
                        <a
                          href={`https://wa.me/${l.telefonoWhatsApp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-bold text-green-600 hover:underline"
                        >
                          WhatsApp
                        </a>
                      )}
                      <button onClick={() => mover(l.id, etapa === 'OFERTA' ? 'CERRADO' : 'CONTACTADO')} className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#3C3B6E] hover:underline">
                        {t('lms.admin.crm.advance')} <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {leads.filter((l) => l.estado === etapa).length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">{t('lms.admin.crm.emptyStage')}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Cerrados / perdidos */}
      <div className="grid grid-cols-2 gap-3">
        {['CERRADO', 'PERDIDO'].map((estado) => (
          <div key={estado} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <p className={cn(
              'text-xs font-bold uppercase tracking-wide mb-2',
              estado === 'CERRADO' ? 'text-green-600' : 'text-slate-400',
            )}>
              {etiqueta(LEAD_ESTADO, estado, lang)}
            </p>
            {leads.filter((l) => l.estado === estado).length === 0 ? (
              <p className="text-xs text-slate-400">{t('lms.admin.crm.emptyStage')}</p>
            ) : (
              <div className="space-y-1.5">
                {leads.filter((l) => l.estado === estado).map((l) => (
                  <div key={l.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{l.nombre}</span>
                    <span className="text-xs text-slate-400">{formatFecha(l.fecha, lang)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Crear lead */}
      <Dialog open={creando} onOpenChange={(o) => !o && setCreando(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('lms.admin.crm.newLead')}</DialogTitle>
            <DialogDescription>{t('lms.admin.crm.newLeadDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>{t('lms.admin.crm.leadName')}</Label>
              <Input value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t('lms.admin.crm.phone')}</Label>
                <Input value={form.telefonoWhatsApp} onChange={(e) => setForm((f) => ({ ...f, telefonoWhatsApp: e.target.value }))} placeholder="+57 300 000 0000" />
              </div>
              <div className="space-y-2">
                <Label>{t('lms.admin.crm.canal')}</Label>
                <Select value={form.canal} onValueChange={(v) => setForm((f) => ({ ...f, canal: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(LEAD_CANAL).map((c) => (
                      <SelectItem key={c} value={c}>{etiqueta(LEAD_CANAL, c, lang)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('lms.admin.crm.nivel')}</Label>
              <Select value={form.nivelEstimado} onValueChange={(v) => setForm((f) => ({ ...f, nivelEstimado: v }))}>
                <SelectTrigger><SelectValue placeholder={t('lms.admin.crm.nivelPh')} /></SelectTrigger>
                <SelectContent>
                  {['A1', 'A2', 'B1', 'B2', 'C1'].map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('lms.admin.crm.notas')}</Label>
              <Textarea rows={2} value={form.notas} onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreando(false)}>{t('lms.cancelar')}</Button>
              <Button onClick={crear} disabled={guardando || !form.nombre.trim()}>
                {guardando && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t('lms.admin.crm.newLead')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
