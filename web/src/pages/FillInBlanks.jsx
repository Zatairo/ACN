import { db } from '../api/base44Client';

import { useState, useEffect, useCallback } from 'react';
import { useOutletContext, Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Loader2, Check, X, RefreshCw, FileText, Trophy, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/index.jsx';

const FALLBACK_VOCAB = ['engineer', 'office', 'bridge', 'design', 'computer', 'breakfast', 'children', 'morning', 'bilingual', 'company', 'notebook', 'family', 'opportunity', 'building', 'english'];
const FALLBACK_TEXT = `Juan is an engineer who works in Medellin. Every morning he wakes up early and helps his two children get ready for school. He makes breakfast and then drives to his office. At work, Juan designs bridges and roads. He uses a computer to draw plans for new buildings. Juan studies English every evening because his dream is to work for a bilingual company. His wife Elena supports his goal. In his free time, Juan reads engineering magazines in English and writes new words in a notebook.`;

export default function FillInBlanks() {
  const { t } = useI18n();
  const { profile, loading } = useOutletContext();
  const [exercises, setExercises] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loadingGame, setLoadingGame] = useState(true);
  const [lessonTitle, setLessonTitle] = useState('');

  const initGame = useCallback(async () => {
    setLoadingGame(true);
    setSubmitted(false);
    setAnswers({});
    try {
      const lessons = await db.entities.Lesson.filter({}, '-created_date', 1);
      const lesson = lessons[0];

      const vocab = lesson?.key_vocabulary?.length ? lesson.key_vocabulary : FALLBACK_VOCAB;
      const readingText = lesson?.reading_text || FALLBACK_TEXT;
      const level = lesson?.level || profile?.english_level || 'A2';
      setLessonTitle(lesson?.title || t('fillblanks.sampleLesson'));

      const result = await db.integrations.Core.InvokeLLM({
        prompt: `Create 7 fill-in-the-blanks exercises for an English learner at ${level} level (CEFR).

Based on this vocabulary and reading text:
Vocabulary: ${vocab.join(', ')}
Reading text: ${readingText}

Instructions:
- Create exactly 7 sentences, each with ONE blank marked as "___"
- The blank must be a single word from the vocabulary list
- Sentences should be inspired by the reading text but can be original
- Grammar and level must match ${level} (CEFR)
- Each exercise needs a "hint" (first letter + total letters, e.g. "e_____r (8 letters)")

Return JSON with an "exercises" array.`,
        response_json_schema: {
          type: 'object',
          properties: {
            exercises: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  sentence: { type: 'string' },
                  answer: { type: 'string' },
                  hint: { type: 'string' },
                },
              },
            },
          },
        },
      });

      const ex = result.exercises || [];
      setExercises(ex.filter((e) => e.sentence && e.answer));
    } catch {
      setExercises([]);
    } finally {
      setLoadingGame(false);
    }
  }, [profile]);

  useEffect(() => {
    if (!loading && profile) initGame();
  }, [loading, profile, initGame]);

  const handleAnswer = (index, value) => {
    setAnswers((prev) => ({ ...prev, [index]: value }));
  };

  const isCorrect = (index) => {
    const ex = exercises[index];
    if (!ex) return false;
    return (answers[index] || '').trim().toLowerCase() === ex.answer.trim().toLowerCase();
  };

  const score = submitted ? exercises.filter((_, i) => isCorrect(i)).length : 0;

  if (loading || loadingGame) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-[#3C3B6E] animate-spin" />
        <p className="text-sm text-slate-400">{t('fillblanks.generating')}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">{t('fillblanks.completeOnboarding')}</p>
        <Link to="/onboarding" className="text-[#3C3B6E] font-medium hover:underline mt-2 inline-block">{t('lessons.start')} →</Link>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">{t('fillblanks.couldNotGenerate')}</p>
        <Link to="/" className="text-[#3C3B6E] font-medium hover:underline mt-2 inline-block">{t('fillblanks.backHome')} →</Link>
      </div>
    );
  }

  const renderSentence = (exercise, index) => {
    const parts = exercise.sentence.split('___');
    return (
      <div className="text-slate-700 leading-loose text-[15px]">
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && (
              <>
                <input
                  type="text"
                  value={answers[index] || ''}
                  onChange={(e) => handleAnswer(index, e.target.value)}
                  disabled={submitted}
                  className={cn(
                    'inline-block w-28 mx-1 px-2 py-1 rounded-lg border-2 text-center font-semibold text-sm align-middle focus:outline-none transition-colors',
                    !submitted && 'border-slate-200 focus:border-[#3C3B6E] bg-white',
                    submitted && isCorrect(index) && 'border-green-500 bg-green-50 text-green-700',
                    submitted && !isCorrect(index) && 'border-red-500 bg-red-50 text-red-700'
                  )}
                  placeholder="____"
                />
                {submitted && !isCorrect(index) && (
                  <span className="text-green-600 font-semibold text-xs ml-1">→ {exercise.answer}</span>
                )}
              </>
            )}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#3C3B6E]">
        <ArrowLeft className="w-4 h-4" /> {t('fillblanks.backHome')}
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#3C3B6E] flex items-center gap-2">
            <FileText className="w-6 h-6" /> {t('fillblanks.title')}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{t('fillblanks.basedOn')} {lessonTitle}</p>
        </div>
        <Button onClick={initGame} variant="outline" className="rounded-xl border-slate-200">
          <RefreshCw className="w-4 h-4 mr-2" /> {t('fillblanks.newRound')}
        </Button>
      </div>

      {!submitted && (
        <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">
          {t('fillblanks.tip')}
        </div>
      )}

      {submitted && (
        <div className={cn(
          'rounded-2xl p-5 text-center',
          score === exercises.length ? 'bg-gradient-to-r from-green-500 to-green-600' :
          score >= exercises.length / 2 ? 'bg-gradient-to-r from-[#3C3B6E] to-[#2e2d5a]' :
          'bg-gradient-to-r from-[#B22234] to-[#9e1e2e]'
        )}>
          <Trophy className="w-10 h-10 mx-auto mb-1 text-white" />
          <p className="text-2xl font-bold text-white">{score} / {exercises.length}</p>
          <p className="text-white/80 text-sm">
            {score === exercises.length ? t('fillblanks.perfect') : score >= exercises.length / 2 ? t('fillblanks.wellDone') : t('fillblanks.keepPracticing')}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {exercises.map((exercise, index) => (
          <div
            key={index}
            className={cn(
              'bg-white rounded-2xl border-2 p-5 transition-colors',
              submitted && isCorrect(index) ? 'border-green-200' :
              submitted && !isCorrect(index) ? 'border-red-200' : 'border-slate-100'
            )}
          >
            <div className="flex items-start gap-3">
              <span className={cn(
                'shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                submitted && isCorrect(index) ? 'bg-green-100 text-green-700' :
                submitted && !isCorrect(index) ? 'bg-red-100 text-red-700' :
                'bg-[#3C3B6E]/10 text-[#3C3B6E]'
              )}>
                {submitted && isCorrect(index) ? <Check className="w-4 h-4" /> :
                 submitted && !isCorrect(index) ? <X className="w-4 h-4" /> :
                 index + 1}
              </span>
              <div className="flex-1">
                {renderSentence(exercise, index)}
                {!submitted && exercise.hint && (
                  <p className="text-xs text-slate-400 mt-2 italic">{t('fillblanks.hint')} {exercise.hint}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {!submitted && exercises.length > 0 && (
        <Button onClick={() => setSubmitted(true)} className="w-full bg-[#3C3B6E] hover:bg-[#2e2d5a] text-white rounded-xl py-2.5 font-semibold">
          {t('fillblanks.checkAnswers')}
        </Button>
      )}
    </div>
  );
}

