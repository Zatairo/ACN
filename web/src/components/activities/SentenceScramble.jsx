import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Check, X, RotateCcw } from 'lucide-react';
import { useI18n } from '@/lib/i18n/index.jsx';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function SentenceScramble({ data, onComplete }) {
  const { t } = useI18n();
  const sentences = data.sentences || [];
  const [index, setIndex] = useState(0);
  const [available, setAvailable] = useState([]);
  const [chosen, setChosen] = useState([]);
  const [results, setResults] = useState([]);
  const [checked, setChecked] = useState(false);

  const current = sentences[index];
  const correctOrder = (current?.words || []).join(' ');
  const isCorrect = chosen.join(' ') === correctOrder;

  useEffect(() => {
    if (current) {
      setAvailable(shuffle(current.words));
      setChosen([]);
      setChecked(false);
    }
  }, [index, sentences]);

  const handleChoose = (word) => {
    const idx = available.indexOf(word);
    setAvailable(available.filter((_, i) => i !== idx));
    setChosen([...chosen, word]);
  };

  const handleUnchoose = (i) => {
    setAvailable([...available, chosen[i]]);
    setChosen(chosen.filter((_, idx) => idx !== i));
  };

  const handleCheck = () => {
    setChecked(true);
    const ok = isCorrect;
    const newResults = [...results, ok];
    setResults(newResults);
    setTimeout(() => {
      if (index + 1 < sentences.length) {
        setIndex(index + 1);
      } else {
        const passed = newResults.filter(Boolean).length >= Math.ceil(sentences.length * 0.7);
        onComplete(passed);
      }
    }, 1500);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">{t('ss.sentenceOf', { current: index + 1, total: sentences.length })}</p>
        <p className="text-xs text-slate-400">{current?.context || ''}</p>
      </div>

      <div className="min-h-16 bg-slate-50 rounded-xl p-4 flex flex-wrap gap-2 items-start">
        {chosen.length === 0 && <span className="text-slate-300 text-sm">{t('ss.tapWords')}</span>}
        {chosen.map((word, i) => (
          <button
            key={i}
            onClick={() => !checked && handleUnchoose(i)}
            className={cn(
              'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              checked && isCorrect ? 'bg-green-500 text-white' :
              checked && !isCorrect ? 'bg-red-500 text-white' :
              'bg-[#3C3B6E] text-white hover:bg-[#2e2d5a]'
            )}
          >
            {word}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {available.map((word, i) => (
          <button
            key={i}
            onClick={() => handleChoose(word)}
            disabled={checked}
            className="px-3 py-2 rounded-lg bg-white border-2 border-slate-200 text-slate-700 text-sm font-medium hover:border-[#3C3B6E] disabled:opacity-50"
          >
            {word}
          </button>
        ))}
      </div>

      {checked && (
        <div className={cn('text-center py-2 rounded-xl font-bold text-sm', isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600')}>
          {isCorrect ? <><Check className="w-4 h-4 inline mr-1" /> {t('ss.correct')}</> : <><X className="w-4 h-4 inline mr-1" /> {correctOrder}</>}
        </div>
      )}

      <div className="flex justify-center gap-2">
        <button
          onClick={() => { setAvailable(shuffle(current.words)); setChosen([]); setChecked(false); }}
          disabled={checked}
          className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-50"
        >
          <RotateCcw className="w-4 h-4 inline mr-1" /> {t('ss.restart')}
        </button>
        <button
          onClick={handleCheck}
          disabled={available.length > 0 || checked}
          className={cn(
            'px-6 py-2 rounded-lg text-sm font-bold text-white',
            available.length > 0 || checked ? 'bg-slate-300' : 'bg-[#3C3B6E] hover:bg-[#2e2d5a]'
          )}
        >
          {t('ss.check')}
        </button>
      </div>
    </div>
  );
}