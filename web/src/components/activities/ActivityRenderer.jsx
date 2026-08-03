import VisualStorytelling from './VisualStorytelling';
import Hangman from './Hangman';
import WordSearchActivity from './WordSearchActivity';
import FillGaps from './FillGaps';
import ReadingCompleting from './ReadingCompleting';
import VocabularyContext from './VocabularyContext';
import Transcriptor from './Transcriptor';
import ImageToWord from './ImageToWord';
import SentenceScramble from './SentenceScramble';
import AIRoleplay from './AIRoleplay';
import { useI18n } from '@/lib/i18n/index.jsx';

export default function ActivityRenderer({ activity, accent, onComplete }) {
  const { t } = useI18n();
  const props = { data: activity.data || {}, accent, onComplete };
  switch (activity.type) {
    case 'visual_storytelling': return <VisualStorytelling {...props} />;
    case 'hangman': return <Hangman {...props} />;
    case 'word_search': return <WordSearchActivity {...props} />;
    case 'fill_gaps': return <FillGaps {...props} />;
    case 'reading_completing': return <ReadingCompleting {...props} />;
    case 'vocabulary_context': return <VocabularyContext {...props} />;
    case 'transcriptor': return <Transcriptor {...props} />;
    case 'image_to_word': return <ImageToWord {...props} />;
    case 'sentence_scramble': return <SentenceScramble {...props} />;
    case 'ai_roleplay': return <AIRoleplay {...props} />;
    default:
      return <div className="text-sm text-slate-400 text-center py-3">{t('activity.unknownType')} {activity.type}</div>;
  }
}