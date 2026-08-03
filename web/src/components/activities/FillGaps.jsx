import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Trophy } from 'lucide-react';
import { useI18n } from '@/lib/i18n/index.jsx';

export default function FillGaps({ data, onComplete }) {
  const { t } = useI18n();
  const exercises = data.exercises || [];
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const isCorrect = (index) => {
    const ex = exercises[index];
    return (answers[index] || '').trim().toLowerCase() === (ex?.answer || '').trim().toLowerCase();
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const correct = exercises.filter((_, i) => isCorrect(i)).length;
    const passed = correct >= Math.ceil(exercises.length * 0.7);
    setTimeout(() => onComplete(passed), 2000);
  };

  if (submitted) {
    const correct = exercises.filter((_, i) => isCorrect(i)).length;
    return (
      <div className="space-y-4">
        {exercises.map((ex, i) => (
          <div key={i} className="text-slate-700 text-[15px] leading-relaxed">
            {ex.sentence.split('___').map((part, j, arr) => (
              <span key={j}>
                {part}
                {j < arr.length - 1 && (
                  <span className={cn('inline-block px-2 mx-1 py-0.5 rounded font-semibold text-sm border-2', isCorrect(i) ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700 line-through')}>
                    {answers[i] || '—'}
                  </span>
                )}
              </span>
            ))}
            {!isCorrect(i) && <span className="text-green-600 text-xs ml-1">→ {ex.answer}</span>}
          </div>
        ))}
        <div className={cn('rounded-xl p-4 text-center text-white', correct >= Math.ceil(exercises.length * 0.7) ? 'bg-green-600' : 'bg-[#B22234]')}>
          <Trophy className="w-8 h-8 mx-auto mb-1" />
          <p className="text-xl font-bold">{correct} / {exercises.length}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {exercises.map((ex, i) => (
        <div key={i} className="text-slate-700 text-[15px] leading-loose">
          {ex.sentence.split('___').map((part, j, arr) => (
            <span key={j}>
              {part}
              {j < arr.length - 1 && (
                <input
                  type="text"
                  value={answers[i] || ''}
                  onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                  className="inline-block w-28 mx-1 px-2 py-1 rounded-lg border-2 border-slate-200 text-center font-semibold text-sm focus:border-[#3C3B6E] focus:outline-none bg-white"
                  placeholder="___"
                />
              )}
            </span>
          ))}
          {ex.hint && <p className="text-xs text-slate-400 mt-1 italic">{t('fillblanks.hint')} {ex.hint}</p>}
        </div>
      ))}
      <Button onClick={handleSubmit} disabled={exercises.length === 0} className="bg-[#3C3B6E] hover:bg-[#2e2d5a] text-white rounded-xl">
        {t('fillgaps.check')}
      </Button>
    </div>
  );
}