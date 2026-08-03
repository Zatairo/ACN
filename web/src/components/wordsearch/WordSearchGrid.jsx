import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { useI18n } from '@/lib/i18n/index.jsx';

function getCellPath(s, e) {
  if (!s || !e) return [];
  const dr = e.row - s.row;
  const dc = e.col - s.col;
  const adr = Math.abs(dr);
  const adc = Math.abs(dc);
  if (dr !== 0 && dc !== 0 && adr !== adc) return null;
  const len = Math.max(adr, adc) + 1;
  const sr = Math.sign(dr);
  const sc = Math.sign(dc);
  const cells = [];
  for (let i = 0; i < len; i++) {
    cells.push({ row: s.row + sr * i, col: s.col + sc * i });
  }
  return cells;
}

export default function WordSearchGrid({ game, onWordFound }) {
  const { t } = useI18n();
  const { grid, words, size } = game;
  const [isDragging, setIsDragging] = useState(false);
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [foundWords, setFoundWords] = useState([]);
  const [typed, setTyped] = useState('');
  const [typedMiss, setTypedMiss] = useState(false);

  const currentPath = start ? getCellPath(start, end) || [start] : [];

  const submitTyped = () => {
    const value = typed.trim().toUpperCase();
    if (!value) return;
    const matched = words.find((w) => !foundWords.includes(w.word) && w.word === value);
    if (matched) {
      const newFound = [...foundWords, matched.word];
      setFoundWords(newFound);
      setTyped('');
      onWordFound?.(newFound.length, words.length);
    } else {
      setTypedMiss(true);
      setTimeout(() => setTypedMiss(false), 1200);
    }
  };

  const handlePointerDown = (row, col) => {
    setIsDragging(true);
    setStart({ row, col });
    setEnd({ row, col });
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (el?.dataset?.cell) {
      const [row, col] = el.dataset.cell.split(',').map(Number);
      setEnd({ row, col });
    }
  };

  const handlePointerUp = useCallback(() => {
    if (!isDragging || !start || !end) {
      setIsDragging(false);
      setStart(null);
      setEnd(null);
      return;
    }
    const path = getCellPath(start, end);
    if (path && path.length > 1) {
      const letters = path.map((c) => grid[c.row][c.col]).join('');
      const reversed = [...letters].reverse().join('');
      const matched = words.find(
        (w) => !foundWords.includes(w.word) && (w.word === letters || w.word === reversed)
      );
      if (matched) {
        const newFound = [...foundWords, matched.word];
        setFoundWords(newFound);
        onWordFound?.(newFound.length, words.length);
      }
    }
    setIsDragging(false);
    setStart(null);
    setEnd(null);
  }, [isDragging, start, end, grid, words, foundWords, onWordFound]);

  useEffect(() => {
    if (!isDragging) return;
    const handler = () => handlePointerUp();
    window.addEventListener('pointerup', handler);
    return () => window.removeEventListener('pointerup', handler);
  }, [isDragging, handlePointerUp]);

  const isInPath = (row, col) => currentPath.some((c) => c.row === row && c.col === col);

  const isFoundCell = (row, col) =>
    words.some(
      (w) => foundWords.includes(w.word) && w.cells.some((c) => c.row === row && c.col === col)
    );

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 overflow-x-auto">
        <div
          role="grid"
          aria-label={t('wordsearch.title')}
          onPointerMove={handlePointerMove}
          className="inline-grid gap-0.5 touch-none select-none"
          style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
        >
          {grid.map((row, r) =>
            row.map((letter, c) => {
              const selected = isInPath(r, c);
              const found = isFoundCell(r, c);
              return (
                <div
                  key={`${r}-${c}`}
                  data-cell={`${r},${c}`}
                  onPointerDown={() => handlePointerDown(r, c)}
                  className={cn(
                    'w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm font-bold rounded cursor-pointer transition-colors',
                    found
                      ? 'bg-[#3C3B6E] text-white'
                      : selected
                        ? 'bg-[#B22234] text-white'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  )}
                >
                  {letter}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="lg:w-56 shrink-0">
        <h3 className="text-sm font-bold text-slate-700 mb-3">{t('ws.wordsToFindTitle')}</h3>
        <div className="space-y-1.5 mb-4">
          {words.map((w, i) => {
            const found = foundWords.includes(w.word);
            return (
              <div
                key={i}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  found ? 'bg-[#3C3B6E]/10 text-[#3C3B6E] line-through' : 'bg-slate-50 text-slate-600'
                )}
              >
                {found && <Check className="w-3.5 h-3.5" />}
                {w.word}
              </div>
            );
          })}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitTyped();
          }}
          className="space-y-1.5"
        >
          <label htmlFor="word-search-typed" className="sr-only">
            {t('wordsearch.srLabel')}
          </label>
          <input
            id="word-search-typed"
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={t('wordsearch.typeWord')}
            className={cn(
              'w-full px-3 py-2 rounded-xl border-2 text-sm focus:outline-none',
              typedMiss ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-[#3C3B6E]'
            )}
          />
          <button
            type="submit"
            disabled={!typed.trim()}
            className="w-full py-2 rounded-xl text-sm font-bold text-white bg-[#3C3B6E] hover:bg-[#2e2d5a] disabled:opacity-50"
          >
            {t('wordsearch.findWord')}
          </button>
          {typedMiss && <p className="text-xs text-red-500 font-medium">{t('wordsearch.notInList')}</p>}
        </form>
      </div>
    </div>
  );
}