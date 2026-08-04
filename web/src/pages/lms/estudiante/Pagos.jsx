import { useState, useEffect, useCallback } from 'react';
import { CreditCard, Upload, Loader2, Banknote, History } from 'lucide-react';
import { paymentsApi, packagesApi, uploadFile, dashboardApi } from '@/api/lmsClient';
import { LmsPage, EstadoBadge, Spinner, EmptyState, StatCard } from '@/components/lms/common';
import { formatCOP, formatFechaHora, etiqueta, PAGO_ESTADO, PAGO_METODO } from '@/lib/lms-formatters';
import { useI18n } from '@/lib/i18n/index.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

// ─────────────────────────────────────────────────────────────
// F2.B5 — Planes y pagos del estudiante: paquete contratado y
// consumido, registrar pago manual (subir comprobante Nequi/
// Davivienda) e historial con estados.
// ─────────────────────────────────────────────────────────────

export default function EstudiantePagos() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const [payments, setPayments] = useState(null);
  const [packages, setPackages] = useState([]);
  const [matricula, setMatricula] = useState(null);
  const [abierto, setAbierto] = useState(false);
  const [concepto, setConcepto] = useState('');
  const [valor, setValor] = useState('');
  const [metodo, setMetodo] = useState('NEQUI');
  const [referencia, setReferencia] = useState('');
  const [comprobanteUrl, setComprobanteUrl] = useState('');
  const [comprobanteNombre, setComprobanteNombre] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const load = useCallback(async () => {
    try {
      const [pays, pkgs, dash] = await Promise.all([
        paymentsApi.list(),
        packagesApi.list(),
        dashboardApi.me(),
      ]);
      setPayments(pays);
      setPackages(pkgs);
      setMatricula(dash.matricula);
    } catch {
      setPayments([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!payments) return <Spinner />;

  const totalAprobado = payments.filter((p) => p.estado === 'APROBADO').reduce((a, p) => a + p.valorCOP, 0);
  const totalPendiente = payments.filter((p) => p.estado === 'PENDIENTE').reduce((a, p) => a + p.valorCOP, 0);

  const subirComprobante = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendo(true);
    try {
      const up = await uploadFile(file);
      setComprobanteUrl(up.url);
      setComprobanteNombre(up.nombre);
      toast({ title: t('lms.uploadOk'), description: up.nombre });
    } catch (err) {
      toast({ title: t('lms.error'), description: err.message, variant: 'destructive' });
    } finally {
      setSubiendo(false);
      e.target.value = '';
    }
  };

  const registrarPago = async () => {
    if (!concepto.trim() || !Number(valor) || !comprobanteUrl) {
      toast({ title: t('lms.error'), description: t('lms.payment.requiredFields'), variant: 'destructive' });
      return;
    }
    setEnviando(true);
    try {
      await paymentsApi.create({
        enrollmentId: matricula?.id ?? null,
        concepto: concepto.trim(),
        valorCOP: Number(valor),
        metodo,
        referencia: referencia.trim() || null,
        comprobanteUrl,
      });
      toast({ title: t('lms.payment.registered'), description: t('lms.payment.pendingApproval') });
      setAbierto(false);
      setConcepto('');
      setValor('');
      setReferencia('');
      setComprobanteUrl('');
      setComprobanteNombre('');
      load();
    } catch (err) {
      toast({ title: t('lms.error'), description: err.message, variant: 'destructive' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-6">
      <LmsPage
        title={t('lms.student.payments')}
        subtitle={t('lms.student.paymentsSubtitle')}
        actions={
          <Button onClick={() => setAbierto(true)}>
            <Banknote className="w-4 h-4 mr-2" /> {t('lms.payment.register')}
          </Button>
        }
      />

      {/* Paquete contratado */}
      {matricula && (
        <div className="bg-gradient-to-br from-[#3C3B6E] to-[#2e2d5a] text-white rounded-xl p-5 flex flex-wrap items-center gap-6">
          <div className="flex-1 min-w-[200px]">
            <p className="text-white/60 text-xs uppercase tracking-wider">{t('lms.student.package')}</p>
            <p className="text-lg font-bold">{matricula.paquete} · {matricula.curso}</p>
            <p className="text-sm text-white/70 mt-0.5">
              {t('lms.payment.price')}: {formatCOP(matricula.precioCOP ?? 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{matricula.sesionesRestantes}</p>
            <p className="text-[11px] text-white/60">{t('lms.student.sessionsLeft')}</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{matricula.sesionesUsadas}</p>
            <p className="text-[11px] text-white/60">{t('lms.payment.used')}</p>
          </div>
        </div>
      )}

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard label={t('lms.payment.approved')} value={formatCOP(totalAprobado)} icon={CreditCard} color="text-green-600" />
        <StatCard label={t('lms.payment.pending')} value={formatCOP(totalPendiente)} icon={History} color="text-amber-600" />
      </div>

      {/* Historial */}
      <div>
        <h3 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
          <History className="w-4 h-4 text-[#3C3B6E]" /> {t('lms.student.paymentHistory')}
        </h3>
        {payments.length === 0 ? (
          <EmptyState icon={History} title={t('lms.student.noPayments')} />
        ) : (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm divide-y divide-slate-50">
            {payments.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">{p.concepto}</p>
                  <p className="text-[11px] text-slate-400">
                    {etiqueta(PAGO_METODO, p.metodo, lang)} · {formatFechaHora(p.fecha, lang)}
                    {p.referencia && ` · ${p.referencia}`}
                  </p>
                  {p.comprobanteUrl && (
                    <a href={p.comprobanteUrl} target="_blank" rel="noreferrer" className="text-[11px] text-[#3C3B6E] hover:underline inline-flex items-center gap-1 mt-0.5">
                      <Upload className="w-3 h-3" /> {t('lms.payment.viewReceipt')}
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-semibold text-slate-800">{formatCOP(p.valorCOP)}</span>
                  <EstadoBadge estado={p.estado} label={etiqueta(PAGO_ESTADO, p.estado, lang)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Diálogo de registro de pago */}
      <Dialog open={abierto} onOpenChange={(o) => !o && setAbierto(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('lms.payment.register')}</DialogTitle>
            <DialogDescription>{t('lms.payment.registerDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>{t('lms.payment.concept')}</Label>
              <Input value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder={t('lms.payment.conceptPlaceholder')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t('lms.payment.amount')} (COP)</Label>
                <Input type="number" min={1} value={valor} onChange={(e) => setValor(e.target.value)} placeholder="510000" />
              </div>
              <div className="space-y-2">
                <Label>{t('lms.payment.method')}</Label>
                <Select value={metodo} onValueChange={setMetodo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEQUI">Nequi</SelectItem>
                    <SelectItem value="DAVIVIENDA">Davivienda</SelectItem>
                    <SelectItem value="EFECTIVO">{t('lms.payment.cash')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('lms.payment.reference')}</Label>
              <Input value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder={t('lms.payment.referencePlaceholder')} />
            </div>
            <div className="space-y-2">
              <Label>{t('lms.payment.receipt')} *</Label>
              <div className="rounded-lg border-2 border-dashed border-slate-200 p-4 text-center">
                <input type="file" id="comprobante" className="hidden" onChange={subirComprobante} accept=".png,.jpg,.jpeg,.pdf" />
                <label htmlFor="comprobante" className="inline-flex items-center gap-1.5 text-xs font-semibold bg-slate-100 text-slate-700 px-4 py-2 rounded-lg cursor-pointer hover:bg-slate-200">
                  {subiendo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {t('lms.payment.uploadReceipt')}
                </label>
                {comprobanteNombre && <p className="text-xs text-green-600 mt-2">{comprobanteNombre}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAbierto(false)}>{t('lms.cancelar')}</Button>
              <Button onClick={registrarPago} disabled={enviando || subiendo}>
                {enviando && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t('lms.payment.register')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
