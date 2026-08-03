import { db } from '../api/base44Client';

import { useState, useEffect } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';

import { ArrowLeft, Loader2, Trophy } from 'lucide-react';
import LessonEngine from '@/components/lesson/LessonEngine';
import LessonContent from '@/components/LessonContent';
import { checkLevelTransition, levelLabel, MASTERY_THRESHOLD } from '@/lib/progression';
import { useI18n } from '@/lib/i18n/index.jsx';

export default function LessonView() {
  const { t } = useI18n();
  const { id } = useParams();
  const { profile, refetchProfile } = useOutletContext();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accent, setAccent] = useState('us');
  const [results, setResults] = useState({});
  const [levelUp, setLevelUp] = useState(null);

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    try {
      const data = await db.entities.Lesson.get(id);
      setLesson(data);
      setAccent(data.audio_accent || 'us');
      const existing = {};
      (data.activities || []).forEach((a, i) => {
        if (a.result !== undefined) existing[i] = a.result;
      });
      setResults(existing);
    } catch {
      /* not found */
    } finally {
      setLoading(false);
    }
  };

  const hasActivities = (lesson?.activities || []).length > 0;

  const handleResult = async (index, passed, allResults) => {
    setResults(allResults);
    if (!lesson?.id) return;

    const activities = lesson.activities || [];
    const completedCount = Object.keys(allResults).length;
    const passedCount = Object.values(allResults).filter(Boolean).length;
    const allDone = completedCount === activities.length;
    const mastered = allDone && passedCount >= MASTERY_THRESHOLD;

    try {
      const updatedActivities = activities.map((a, i) => ({ ...a, result: allResults[i] }));
      await db.entities.Lesson.update(lesson.id, {
        activities_completed: completedCount,
        activities_passed: passedCount,
        completed: allDone,
        mastered,
        activities: updatedActivities,
        audio_accent: accent,
      });

      if (allDone && mastered) {
        const newLevel = await checkLevelTransition(profile);
        if (newLevel) {
          setLevelUp(newLevel);
          if (refetchProfile) await refetchProfile();
        }
      }
    } catch {
      /* ignore */
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#3C3B6E] animate-spin" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-500">{t('lesson.notFound')}</p>
        <Link to="/my-lessons" className="text-[#3C3B6E] font-medium hover:underline mt-2 inline-block">← {t('lesson.backToMyLessons')}</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/my-lessons" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#3C3B6E] mb-4">
        <ArrowLeft className="w-4 h-4" /> {t('lesson.backToMyLessons')}
      </Link>

      {levelUp && (
        <div className="mb-6 bg-gradient-to-r from-[#3C3B6E] to-[#B22234] rounded-2xl p-6 text-center text-white">
          <Trophy className="w-12 h-12 mx-auto mb-2" />
          <h2 className="text-2xl font-bold">{t('lesson.levelUnlocked')}</h2>
          <p className="mt-1">{t('lesson.yourLevelNow')} <strong>{levelUp}</strong> — {levelLabel(levelUp)}</p>
          <p className="text-white/70 text-xs mt-1">{t('lesson.averaged')}</p>
        </div>
      )}

      {hasActivities ? (
        <LessonEngine key={lesson.id} lesson={lesson} accent={accent} onAccentChange={setAccent} initialResults={results} onResult={handleResult} />
      ) : (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
            {t('lesson.legacyFormat')}
            <Link to="/" className="font-semibold underline ml-1">{t('lesson.goHome')}</Link>
          </div>
          <LessonContent lesson={lesson} />
        </div>
      )}
    </div>
  );
}

