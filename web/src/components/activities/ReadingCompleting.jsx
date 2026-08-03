import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n/index.jsx';

export default function ReadingCompleting({ data, onComplete }) {
  const { t } = useI18n();
  const passages = data.passages || [];
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const isCorrect = (i) => answers[i] === passages[i]?.answer;
  const correctCount = submitted ? passages.filter((_, i) => isCorrect(i)).length : 0;

  const handleSubmit = () => {
    setSubmitted(true);
    const correct = passages.filter((_, i) => isCorrect(i)).length;
    const passed = correct >= Math.ceil(passages.length * 0.7);
    setTimeout(() => onComplete(passed), 2000);
  };

  return (
    <div className="space-y-5">
      {passages.map((p, i) => (
        <div key={i} className="space-y-3">
          <div className="text-slate-700 text-[15px] leading-relaxed bg-slate-50 rounded-xl p-4 whitespace-pre-wrap">
            {p.text}
          </div>
          <p className="text-xs font-semibold text-slate-500">{t('vs.whichConclusion')}</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {p.options.map((opt, j) => {
              const isAnswer = opt === p.answer;
              const isSelected = answers[i] === opt;
              return (
                <button
                  key={j}
                  onClick={() => !submitted && setAnswers({ ...answers, [i]: opt })}
                  className={cn(
                    'text-left px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all',
                    !submitted && isSelected && 'border-[#3C3B6E] bg-[#3C3B6E]/5',
                    !submitted && !isSelected && 'border-slate-200 hover:border-slate-300',
                    submitted && isAnswer && 'border-green-500 bg-green-50 text-green-700',
                    submitted && isSelected && !isAnswer && 'border-red-500 bg-red-50 text-red-700',
                    submitted && !isAnswer && !isSelected && 'opacity-50'
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    {opt}
                    {submitted && isAnswer && <Check className="w-4 h-4 shrink-0" />}
                    {submitted && isSelected && !isAnswer && <X className="w-4 h-4 shrink-0" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {!submitted ? (
        <button onClick={handleSubmit} disabled={Object.keys(answers).length < passages.length} className={cn('w-full py-2.5 rounded-xl font-bold text-white', Object.keys(answers).length < passages.length ? 'bg-slate-300' : 'bg-[#3C3B6E] hover:bg-[#2e2d5a]')}>
          {t('fillgaps.check')}
        </button>
      ) : (
        <div className={cn('text-center rounded-xl py-3 font-bold', correctCount >= Math.ceil(passages.length * 0.7) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600')}>
          {correctCount} / {passages.length} {t('rc.correct')}
        </div>
      )}
    </div>
  );
}