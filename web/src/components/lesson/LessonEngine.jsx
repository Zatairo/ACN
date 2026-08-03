import { useState } from 'react';
import ActivityCard from '@/components/activities/ActivityCard';
import ActivityRenderer from '@/components/activities/ActivityRenderer';
import AccentSelector from '@/components/activities/AccentSelector';
import { MASTERY_THRESHOLD } from '@/lib/progression';
import { cn } from '@/lib/utils';
import { Trophy } from 'lucide-react';
import { useI18n } from '@/lib/i18n/index.jsx';

export default function LessonEngine({ lesson, accent, onAccentChange, initialResults = {}, onResult = () => {} }) {
  const { t } = useI18n();
  const [results, setResults] = useState(initialResults);
  const activities = lesson.activities || [];
  const completedCount = Object.keys(results).length;
  const passedCount = Object.values(results).filter(Boolean).length;
  const allDone = completedCount === activities.length && activities.length > 0;
  const mastered = allDone && passedCount >= MASTERY_THRESHOLD;

  const handleComplete = (index, passed) => {
    const newResults = { ...results, [index]: passed };
    setResults(newResults);
    if (onResult) onResult(index, passed, newResults);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="px-3 py-1 rounded-full text-sm font-bold text-white bg-[#3C3B6E]">{lesson.level}</span>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">{lesson.title}</h1>
      </div>

      <div className="bg-slate-50 rounded-xl p-3 space-y-2">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('lesson.accentLabel')}</p>
        <AccentSelector value={accent} onChange={onAccentChange} compact />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold text-slate-700">{t('lesson.activitiesProgress')}</p>
          <p className="text-sm text-slate-500">{completedCount}/{activities.length} {t('lesson.completedOf')} · {passedCount} {t('lesson.passedOf')}</p>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
          {activities.map((_, i) => (
            <div
              key={i}
              className={cn(
                'flex-1 rounded-full transition-colors',
                results[i] === true ? 'bg-green-500' :
                results[i] === false ? 'bg-red-400' :
                'bg-slate-200'
              )}
            />
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {t('lesson.masterHint', { n: MASTERY_THRESHOLD, total: activities.length })}
        </p>
      </div>

      {lesson.key_vocabulary?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {lesson.key_vocabulary.map((word, i) => (
            <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600">{word}</span>
          ))}
        </div>
      )}

      {activities.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center text-amber-700 text-sm">
          {t('lesson.noActivitiesFormat')}
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity, i) => (
            <ActivityCard key={i} index={i} total={activities.length} activity={activity} status={results[i]}>
              <ActivityRenderer activity={activity} accent={accent} onComplete={(passed) => handleComplete(i, passed)} />
            </ActivityCard>
          ))}
        </div>
      )}

      {allDone && (
        <div className={cn('rounded-2xl p-6 text-center text-white', mastered ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-[#B22234] to-[#9e1e2e]')}>
          <Trophy className="w-12 h-12 mx-auto mb-2" />
          <h2 className="text-2xl font-bold">{mastered ? t('lesson.mastered') : t('lesson.completed')}</h2>
          <p className="text-white/80 mt-1">{t('lesson.youPassed', { passed: passedCount, total: activities.length })}</p>
          {!mastered && <p className="text-white/70 text-sm mt-2">{t('lesson.needMore', { n: MASTERY_THRESHOLD })}</p>}
        </div>
      )}
    </div>
  );
}