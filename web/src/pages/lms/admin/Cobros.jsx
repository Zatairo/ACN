import { useState, useEffect, useCallback } from 'react';
import { Wallet, CheckCircle2, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { paymentsApi } from '@/api/lmsClient';
import { LmsPage, EstadoBadge, Spinner, EmptyState, StatCard } from '@/components/lms/common';
import { formatCOP, formatFechaHora, PAGO_ESTADO, PAGO_METODO, etiqueta } from '@/lib/lms-formatters';
import { useI18n } from '@/lib/i18n/index.jsx';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────
// F2.D4 — Cobros: revisar pagos con comprobante, aprobar o
// rechazar. La aprobación es el reconocimiento oficial de
// ingreso (alimenta finanzas).
// ─────────────────────────────────────────────────────────────

export default function AdminCobros() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const [pagos, setPagos] = useState(null);
  const [filtro, setFiltro] = useState('PENDIENTE');
  const [procesando, setProcesando] = useState(null);

  const load = useCallback(async () => {
    try {
      setPagos(await paymentsApi.list());
    } catch {
      setPagos([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!pagos) return <Spinner />;

  const visibles = filtro === 'TODOS' ? pagos : pagos.filter((p) => p.estado === filtro);
  const totalPendiente = pagos.filter((p) => p.estado === 'PENDIENTE').reduce((a, p) => a + p.valorCOP, 0);

  const procesar = async (p, estado) => {
    setProcesando(p.id);
    try {
      await paymentsApi.update(p.id, { estado });
      toast({ title: estado === 'APROBADO' ? t('lms.admin.cobros.approved') : t('lms.admin.cobros.rejected') });
      load();
    } catch (err) {
      toast({ title: t('lms.error'), description: err.message, variant: 'destructive' });
    } finally {
      setProcesando(null);
    }
  };

  return (
    <div className="space-y-6">
      <LmsPage title={t('lms.admin.cobros.title')} subtitle={t('lms.admin.cobros.subtitle')} />

      <div className="grid grid-cols-2 gap-4">
        <StatCard label={t('lms.admin.cobros.pendienteTotal')} value={formatCOP(totalPendiente)} icon={Wallet} color="text-amber-600" />
        <StatCard label={t('lms.admin.cobros.pendienteCantidad')} value={pagos.filter((p) => p.estado === 'PENDIENTE').length} icon={Wallet} color="text-[#3C3B6E]" />
      </div>

      <div className="flex flex-wrap gap-2">
        {['PENDIENTE', 'APROBADO', 'RECHAZADO', 'VENCIDO', 'TODOS'].map((e) => (
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
            {e === 'TODOS' ? t('lms.todos') : etiqueta(PAGO_ESTADO, e, lang)}
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <EmptyState icon={Wallet} title={t('lms.admin.cobros.empty')} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm divide-y divide-slate-50">
          {visibles.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-slate-800">{p.student?.nombre}</p>
                  <EstadoBadge estado={p.estado} label={etiqueta(PAGO_ESTADO, p.estado, lang)} />
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {p.concepto} · {etiqueta(PAGO_METODO, p.metodo, lang)}
                  {p.referencia && ` · ${p.referencia}`} · {formatFechaHora(p.fecha, lang)}
                </p>
                {p.comprobanteUrl && (
                  <a href={p.comprobanteUrl} target="_blank" rel="noreferrer" className="text-[11px] text-[#3C3B6E] hover:underline inline-flex items-center gap-1 mt-0.5">
                    {t('lms.payment.viewReceipt')} <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-semibold text-slate-800">{formatCOP(p.valorCOP)}</span>
                {p.estado === 'PENDIENTE' && (
                  <>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => procesar(p, 'APROBADO')} disabled={procesando === p.id}>
                      {procesando === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                      {t('lms.aprobar')}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => procesar(p, 'RECHAZADO')} disabled={procesando === p.id}>
                      {procesando === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5 mr-1 text-[#B22234]" />}
                      {t('lms.rechazar')}
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
