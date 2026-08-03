import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/index.jsx';

export function getAccents(t) {
  return [
    { id: 'us', label: t('accent.us'), flag: '🇺🇸', desc: t('accent.usDesc') },
    { id: 'uk', label: t('accent.uk'), flag: '🇬🇧', desc: t('accent.ukDesc') },
    { id: 'aus', label: t('accent.aus'), flag: '🇦🇺', desc: t('accent.ausDesc') },
  ];
}

export default function AccentSelector({ value, onChange, compact }) {
  const { t } = useI18n();
  const ACCENTS = getAccents(t);
  return (
    <div className={cn('flex gap-2', compact ? 'flex-wrap' : 'flex-col sm:flex-row')}>
      {ACCENTS.map((a) => (
        <button
          key={a.id}
          onClick={() => onChange(a.id)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all',
            value === a.id
              ? 'border-[#3C3B6E] bg-[#3C3B6E]/5'
              : 'border-slate-200 hover:border-slate-300 bg-white'
          )}
        >
          <span className="text-xl">{a.flag}</span>
          <div className="text-left">
            <p className="text-sm font-bold text-slate-700">{a.label}</p>
            {!compact && <p className="text-[10px] text-slate-400">{a.desc}</p>}
          </div>
        </button>
      ))}
    </div>
  );
}