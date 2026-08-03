import { useState } from 'react';
import { generateWordSearch } from '@/lib/wordSearchGenerator';
import WordSearchGrid from '@/components/wordsearch/WordSearchGrid';

export default function WordSearchActivity({ data, onComplete }) {
  const [game] = useState(() => generateWordSearch(data.words || [], 14));

  const handleWordFound = (count, total) => {
    if (count === total) {
      setTimeout(() => onComplete(true), 800);
    }
  };

  return (
    <WordSearchGrid game={game} onWordFound={handleWordFound} />
  );
}