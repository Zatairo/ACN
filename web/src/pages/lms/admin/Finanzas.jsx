import { useState, useEffect, useCallback } from 'react';
import { Wallet, Download, TrendingUp, Receipt, Loader2 } from 'lucide-react';
import { reportsApi, downloadCsv } from '@/api/lmsClient';
import { LmsPage, Spinner, EmptyState, StatCard } from '@/components/lms/common';
import { formatCOP, PAGO_METODO, etiqueta } from '@/lib/lms-formatters';
import { useI18n } from '@/lib/i18n/index.jsx';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

// ─────────────────────────────────────────────────────────────
// F2.D5 — Finanzas: ingresos aprobados por mes y método, con
// exportación a CSV (compatible con Excel) para la contabilidad
// de la directora.
// ─────────────────────────────────────────────────────────────

export default function AdminFinanzas() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [descargando, setDescargando] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await reportsApi.income());
    } catch {
      setData({ totalCOP: 0, cantidad: 0, porMes: [], porMetodo: [] });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!data) return <Spinner />;

  const exportar = async () => {
    setDescargando(true);
    try {
      await downloadCsv('/reports/income/export', `ingresos-acn-${new Date().toISOString().slice(0, 10)}.csv`);
      toast({ title: t('lms.admin.finanzas.exported') });
    } catch (err) {
      toast({ title: t('lms.error'), description: err.message, variant: 'destructive' });
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div className="space-y-6">
      <LmsPage
        title={t('lms.admin.finanzas.title')}
        subtitle={t('lms.admin.finanzas.subtitle')}
        actions={
          <Button onClick={exportar} disabled={descargando}>
            {descargando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            {t('lms.admin.finanzas.exportCsv')}
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4">
        <StatCard label={t('lms.admin.finanzas.total')} value={formatCOP(data.totalCOP)} icon={Wallet} color="text-green-600" />
        <StatCard label={t('lms.admin.finanzas.cantidad')} value={data.cantidad} icon={Receipt} color="text-[#3C3B6E]" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Por mes */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#3C3B6E]" /> {t('lms.admin.finanzas.porMes')}
          </h3>
          {data.porMes.length === 0 ? (
            <EmptyState icon={TrendingUp} title={t('lms.admin.finanzas.sinDatos')} />
          ) : (
            <div className="space-y-4">
              {data.porMes.map((m) => {
                const max = Math.max(...data.porMes.map((x) => x.totalCOP), 1);
                const pct = Math.round((m.totalCOP / max) * 100);
                return (
                  <div key={m.mes}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">{m.mes}</span>
                      <span className="text-xs text-slate-500">{formatCOP(m.totalCOP)} · {m.cantidad} {t('lms.admin.finanzas.pagos')}</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#3C3B6E] to-[#5a5a9e] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Por método */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold text-slate-700 mb-3">{t('lms.admin.finanzas.porMetodo')}</h3>
          {data.porMetodo.length === 0 ? (
            <EmptyState icon={Wallet} title={t('lms.admin.finanzas.sinDatos')} />
          ) : (
            <div className="space-y-2">
              {data.porMetodo.map((m) => (
                <div key={m.metodo} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{etiqueta(PAGO_METODO, m.metodo, lang)}</p>
                    <p className="text-xs text-slate-400">{m.cantidad} {t('lms.admin.finanzas.pagos')}</p>
                  </div>
                  <p className="font-semibold text-slate-800">{formatCOP(m.totalCOP)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
