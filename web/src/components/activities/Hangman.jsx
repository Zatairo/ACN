import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/index.jsx';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function Hangman({ data, onComplete }) {
  const { t } = useI18n();
  const words = (data.words || []).map((w) => w.toUpperCase().replace(/[^A-Z]/g, '')).filter(Boolean);

  const [wordIndex, setWordIndex] = useState(0);
  const [guessed, setGuessed] = useState([]);
  const [wrong, setWrong] = useState(0);
  const [results, setResults] = useState([]);
  const maxWrong = 6;

  const currentWord = words[wordIndex] || '';
  const wordRevealed = currentWord && currentWord.split('').every((l) => guessed.includes(l));
  const wordFailed = wrong >= maxWrong;

  const advance = (success) => {
    const newResults = [...results, success];
    setResults(newResults);
    setGuessed([]);
    setWrong(0);
    if (wordIndex + 1 < words.length) {
      setWordIndex(wordIndex + 1);
    } else {
      const passed = newResults.filter(Boolean).length;
      onComplete(passed >= Math.max(1, Math.ceil(words.length * 0.6)));
    }
  };

  const handleGuess = (letter) => {
    if (guessed.includes(letter) || wordRevealed || wordFailed) return;
    const nextGuessed = [...guessed, letter];
    const nextWrong = currentWord.includes(letter) ? wrong : wrong + 1;
    setGuessed(nextGuessed);
    setWrong(nextWrong);
    const revealed = currentWord.split('').every((l) => nextGuessed.includes(l));
    const failed = nextWrong >= maxWrong;
    if (revealed || failed) {
      setTimeout(() => advance(revealed), revealed ? 1200 : 1800);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-1.5 mb-2">
        {words.map((_, i) => (
          <div
            key={i}
            className={cn('h-1.5 rounded-full flex-1', i < wordIndex ? 'bg-[#3C3B6E]' : i === wordIndex ? 'bg-[#B22234]' : 'bg-slate-200')}
          />
        ))}
      </div>
      <div className="text-center">
        <p className="text-xs text-slate-500 mb-2">{t('hangman.wordOf', { current: wordIndex + 1, total: words.length })} · {data.theme || t('hangman.theme')}</p>
        <div className="flex justify-center gap-1.5 text-2xl font-bold">
          {currentWord.split('').map((l, i) => (
            <span
              key={i}
              className={cn(
                'w-7 sm:w-8 border-b-2 pb-1 text-center',
                guessed.includes(l) || wordFailed ? 'border-[#3C3B6E] text-[#3C3B6E]' : 'border-slate-300 text-transparent'
              )}
            >
              {guessed.includes(l) || wordFailed ? l : '_'}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">{t('hangman.errors', { wrong, max: maxWrong })}</p>
      </div>
      <div className="grid grid-cols-7 sm:grid-cols-9 gap-1.5 max-w-md mx-auto">
        {LETTERS.map((letter) => {
          const isGuessed = guessed.includes(letter);
          const isCorrect = isGuessed && currentWord.includes(letter);
          const isWrong = isGuessed && !currentWord.includes(letter);
          return (
            <button
              key={letter}
              onClick={() => handleGuess(letter)}
              disabled={isGuessed || wordRevealed || wordFailed}
              className={cn(
                'w-9 h-9 rounded-lg text-sm font-bold transition-colors',
                isCorrect && 'bg-green-500 text-white',
                isWrong && 'bg-red-500 text-white',
                !isGuessed && 'bg-slate-100 hover:bg-slate-200 text-slate-700',
                (isGuessed || wordRevealed || wordFailed) && 'cursor-not-allowed'
              )}
            >
              {letter}
            </button>
          );
        })}
      </div>
    </div>
  );
}