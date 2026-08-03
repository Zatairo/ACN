import { useI18n } from '../lib/i18n/index.jsx';

export default function LangSelector({ variant = 'light' }) {
  const { lang, toggle } = useI18n();
  const cls =
    variant === 'dark'
      ? 'inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100'
      : 'inline-flex items-center gap-1 rounded-full border border-white/40 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={lang === 'es' ? 'Switch to English' : 'Cambiar a español'}
      title={lang === 'es' ? 'Switch to English' : 'Cambiar a español'}
      className={cls}
    >
      {lang === 'es' ? (
        <>
          <span aria-hidden="true">EN</span>
        </>
      ) : (
        <>
          <span aria-hidden="true">ES</span>
        </>
      )}
    </button>
  );
}
