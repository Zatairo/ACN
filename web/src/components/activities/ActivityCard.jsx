import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/index.jsx';

export const ACTIVITY_ICONS = {
  visual_storytelling: '🖼️',
  hangman: '🎯',
  word_search: '🔎',
  fill_gaps: '✏️',
  reading_completing: '📖',
  vocabulary_context: '🔗',
  transcriptor: '🎧',
  image_to_word: '📸',
  sentence_scramble: '🔀',
  ai_roleplay: '💬',
};

export default function ActivityCard({ index, total, activity, status, children }) {
  const { t } = useI18n();
  const passed = status === true;
  const failed = status === false;
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border-2 p-5 sm:p-6 transition-colors',
        passed && 'border-green-200 bg-green-50/30',
        failed && 'border-red-200',
        !passed && !failed && 'border-slate-100'
      )}
    >
      <div className="flex items-start gap-3 mb-4">
        <div
          className={cn(
            'shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-bold',
            passed ? 'bg-green-100 text-green-700' : failed ? 'bg-red-100 text-red-700' : 'bg-[#3C3B6E]/10 text-[#3C3B6E]'
          )}
        >
          {passed ? <CheckCircle2 className="w-5 h-5" /> : failed ? <XCircle className="w-5 h-5" /> : <span className="text-sm">{index + 1}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base">{ACTIVITY_ICONS[activity.type] || '📋'}</span>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">{activity.title}</h3>
          </div>
          {activity.instructions && <p className="text-xs text-slate-500 mt-0.5">{activity.instructions}</p>}
        </div>
        {passed && <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full shrink-0">{t('activity.passed')}</span>}
        {failed && <span className="text-xs font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded-full shrink-0">{t('activity.retry')}</span>}
      </div>
      {children}
    </div>
  );
}

export function ActivityResultButton({ completed, passed, children }) {
  const { t } = useI18n();
  if (completed) {
    return (
      <div className={cn('mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold', passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600')}>
        {passed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
        {passed ? t('fillgaps.passed') : t('fillgaps.tryAgain')}
      </div>
    );
  }
  return children || null;
}