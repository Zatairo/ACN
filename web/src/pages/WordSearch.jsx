import { db } from '../api/base44Client';

import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';

import { generateWordSearch } from '@/lib/wordSearchGenerator';
import WordSearchGrid from '@/components/wordsearch/WordSearchGrid';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Trophy, Grid3x3 } from 'lucide-react';
import { useI18n } from '@/lib/i18n/index.jsx';

const FALLBACK_WORDS = [
  'engineer', 'office', 'bridge', 'design', 'computer',
  'breakfast', 'children', 'morning', 'bilingual', 'company',
  'notebook', 'family', 'opportunity', 'building', 'english',
];

export default function WordSearch() {
  const { t } = useI18n();
  const { profile, loading } = useOutletContext();
  const [game, setGame] = useState(null);
  const [loadingGame, setLoadingGame] = useState(true);
  const [foundCount, setFoundCount] = useState(0);
  const [won, setWon] = useState(false);

  const initGame = useCallback(async () => {
    if (!profile) return;
    setLoadingGame(true);
    setFoundCount(0);
    setWon(false);
    try {
      const result = await db.integrations.Core.InvokeLLM({
        prompt: `Generate exactly 15 English vocabulary words related to the profession "${profile.profession || 'engineering'}" at ${profile.english_level} English level (CEFR). Requirements:
- Single words only (no phrases, no spaces, no hyphens)
- 4 to 12 letters long
- Commonly used in this profession
- All lowercase
Return them in a "words" array.`,
        response_json_schema: {
          type: 'object',
          properties: {
            words: { type: 'array', items: { type: 'string' } },
          },
        },
      });

      let words = (result.words || []).filter((w) => /^[a-zA-Z]+$/.test(w) && w.length >= 3 && w.length <= 12).slice(0, 15);
      if (words.length < 5) words = FALLBACK_WORDS;
      setGame(generateWordSearch(words));
    } catch {
      setGame(generateWordSearch(FALLBACK_WORDS));
    } finally {
      setLoadingGame(false);
    }
  }, [profile]);

  useEffect(() => {
    if (!loading && profile) initGame();
  }, [loading, profile, initGame]);

  const handleWordFound = (count, total) => {
    setFoundCount(count);
    if (count === total) setWon(true);
  };

  if (loading || loadingGame) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#3C3B6E] animate-spin" />
      </div>
    );
  }

  if (!profile || !game) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#3C3B6E] flex items-center gap-2">
            <Grid3x3 className="w-6 h-6" /> {t('wordsearch.title')}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {t('wordsearch.vocabOf')} {profile.profession || t('wordsearch.yourProfession')} · {t('wordsearch.found')} {foundCount}/{game.words.length}
          </p>
        </div>
        <Button onClick={initGame} variant="outline" className="rounded-xl border-slate-200">
          <RefreshCw className="w-4 h-4 mr-2" /> {t('wordsearch.newGame')}
        </Button>
      </div>

      {won && (
        <div className="mb-6 bg-gradient-to-r from-[#3C3B6E] to-[#B22234] rounded-2xl p-6 text-center text-white">
          <Trophy className="w-10 h-10 mx-auto mb-2" />
          <h2 className="text-xl font-bold">{t('wordsearch.congrats')}</h2>
          <p className="text-sm text-white/80">{t('wordsearch.foundAll')}</p>
        </div>
      )}

      <WordSearchGrid game={game} onWordFound={handleWordFound} />
    </div>
  );
}

