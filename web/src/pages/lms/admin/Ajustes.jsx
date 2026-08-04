import { useState, useEffect, useCallback } from 'react';
import { Settings, MessageCircle, CreditCard, CalendarClock, AudioLines, Bot, CheckCircle2, Clock } from 'lucide-react';
import { integrationsApi } from '@/api/lmsClient';
import { LmsPage, Spinner } from '@/components/lms/common';
import { useI18n } from '@/lib/i18n/index.jsx';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────
// F2.D8 — Ajustes: estado de las integraciones del negocio
// (WhatsApp, Wompi, Calendly, ElevenLabs, RAG) y datos de
// contacto de la directora. La activación real es de la Fase 3.
// ─────────────────────────────────────────────────────────────

export default function AdminAjustes() {
  const { t } = useI18n();
  const [integraciones, setIntegraciones] = useState(null);

  const load = useCallback(async () => {
    try {
      setIntegraciones(await integrationsApi.status());
    } catch {
      setIntegraciones({});
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!integraciones) return <Spinner />;

  const lista = [
    { key: 'wompi', nombre: t('lms.admin.ajustes.wompi'), desc: t('lms.admin.ajustes.wompiDesc'), icon: CreditCard },
    { key: 'calendly', nombre: t('lms.admin.ajustes.calendly'), desc: t('lms.admin.ajustes.calendlyDesc'), icon: CalendarClock },
    { key: 'elevenlabs', nombre: t('lms.admin.ajustes.elevenlabs'), desc: t('lms.admin.ajustes.elevenlabsDesc'), icon: AudioLines },
    { key: 'rag', nombre: t('lms.admin.ajustes.rag'), desc: t('lms.admin.ajustes.ragDesc'), icon: Bot },
    { key: 'whatsapp', nombre: t('lms.admin.ajustes.whatsapp'), desc: t('lms.admin.ajustes.whatsappDesc'), icon: MessageCircle },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <LmsPage title={t('lms.admin.ajustes.title')} subtitle={t('lms.admin.ajustes.subtitle')} />

      {/* Integraciones */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-semibold text-slate-700 mb-4">{t('lms.admin.ajustes.integraciones')}</h3>
        <div className="space-y-2">
          {lista.map(({ key, nombre, desc, icon: Icon }) => {
            const estado = integraciones[key];
            return (
              <div key={key} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-[#3C3B6E]" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{nombre}</p>
                    <p className="text-xs text-slate-400">{desc}</p>
                  </div>
                </div>
                {estado === true ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full shrink-0">
                    <CheckCircle2 className="w-3 h-3" /> {t('lms.admin.ajustes.conectado')}
                  </span>
                ) : estado === false ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-200/70 px-2.5 py-1 rounded-full shrink-0">
                    <Clock className="w-3 h-3" /> {t('lms.admin.ajustes.fase3')}
                  </span>
                ) : (
                  <span className={cn(
                    'inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0',
                    typeof estado === 'string' ? 'text-amber-600 bg-amber-50' : 'text-slate-500 bg-slate-200/70',
                  )}>
                    {estado ?? t('lms.admin.ajustes.fase3')}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Datos de contacto del negocio */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-semibold text-slate-700 mb-4">{t('lms.admin.ajustes.contacto')}</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            [t('lms.admin.ajustes.negocio'), 'ACN Institute — Inglés con Propósito'],
            [t('lms.admin.ajustes.directora'), 'Andrea (directora y docente)'],
            [t('lms.admin.ajustes.pagos'), 'Nequi · Davivienda'],
            [t('lms.admin.ajustes.modalidad'), 'Zoom / Google Meet · 45 min'],
            [t('lms.admin.ajustes.horarios'), 'L–S · 7am, 12pm, 5pm (COL)'],
            [t('lms.admin.ajustes.clases'), 'Comunicativa · MCER A1–C1'],
          ].map(([label, valor]) => (
            <div key={label} className="rounded-lg bg-slate-50 px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
              <p className="text-sm font-medium text-slate-700 mt-0.5">{valor}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-4">
          {t('lms.admin.ajustes.fase3Hint')}
        </p>
      </div>

      {/* Seguridad */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Settings className="w-4 h-4 text-[#3C3B6E]" /> {t('lms.admin.ajustes.seguridad')}
        </h3>
        <p className="text-sm text-slate-500">
          {t('lms.admin.ajustes.seguridadDesc')}
        </p>
      </div>
    </div>
  );
}
