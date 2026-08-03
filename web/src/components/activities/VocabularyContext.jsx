import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Check, Link2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n/index.jsx';

export default function VocabularyContext({ data, onComplete }) {
  const { t } = useI18n();
  const pairs = data.pairs || [];
  const words = pairs.map((p) => p.word);
  const [shuffledDefs] = useState(() => [...pairs].sort(() => Math.random() - 0.5));
  const [selectedWord, setSelectedWord] = useState(null);
  const [matched, setMatched] = useState({});
  const [wrong, setWrong] = useState(null);

  const handleDefClick = (def) => {
    if (!selectedWord || matched[selectedWord]) return;
    const correct = pairs.find((p) => p.word === selectedWord)?.definition === def;
    if (correct) {
      setMatched({ ...matched, [selectedWord]: def });
      setSelectedWord(null);
      if (Object.keys({ ...matched, [selectedWord]: def }).length === pairs.length) {
        setTimeout(() => onComplete(true), 1000);
      }
    } else {
      setWrong(def);
      setTimeout(() => setWrong(null), 800);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">{t('vc.selectWord')}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{t('vc.words')}</p>
          {words.map((w) => {
            const isMatched = matched[w];
            const isSelected = selectedWord === w;
            return (
              <button
                key={w}
                onClick={() => !isMatched && setSelectedWord(w)}
                disabled={isMatched}
                className={cn(
                  'w-full text-left px-3 py-2.5 rounded-xl border-2 text-sm font-bold transition-all',
                  isMatched && 'bg-green-50 border-green-200 text-green-700',
                  isSelected && !isMatched && 'border-[#3C3B6E] bg-[#3C3B6E]/5',
                  !isSelected && !isMatched && 'border-slate-200 hover:border-slate-300 text-slate-700'
                )}
              >
                <span className="flex items-center justify-between">
                  {w}
                  {isMatched && <Check className="w-4 h-4" />}
                </span>
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{t('vc.definitions')}</p>
          {shuffledDefs.map((p, i) => {
            const isMatched = Object.values(matched).includes(p.definition);
            const isWrong = wrong === p.definition;
            return (
              <button
                key={i}
                onClick={() => handleDefClick(p.definition)}
                disabled={isMatched}
                className={cn(
                  'w-full text-left px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all text-slate-600',
                  isMatched && 'bg-green-50 border-green-200 text-green-700 opacity-60',
                  isWrong && 'border-red-500 bg-red-50 animate-pulse',
                  !isMatched && !isWrong && 'border-slate-200 hover:border-slate-300'
                )}
              >
                <span className="flex items-start gap-2">
                  <Link2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-300" />
                  {p.definition}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {Object.keys(matched).length === pairs.length && (
        <div className="text-center py-3 bg-green-100 rounded-xl text-green-700 font-bold">{t('vc.allConnected')}</div>
      )}
    </div>
  );
}