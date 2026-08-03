import { db } from '../api/base44Client';

import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';

import { BarChart3, BookOpen, CheckCircle2, Clock, ArrowRight, FileText, Grid3x3, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/index.jsx';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

export default function Dashboard() {
  const { t, lang } = useI18n();
  const { profile, loading } = useOutletContext();
  const [lessons, setLessons] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !profile) return;
    if (profile) loadData();
  }, [loading, profile]);

  const loadData = async () => {
    try {
      const data = await db.entities.Lesson.filter({}, '-created_date', 50);
      setLessons(data);
    } catch {
      /* ignore */
    } finally {
      setLoadingData(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#3C3B6E] rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">{t('dashboard.completeOnboarding')}</p>
        <Link to="/onboarding" className="text-[#3C3B6E] font-medium hover:underline mt-2 inline-block">{t('lessons.start')} →</Link>
      </div>
    );
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#3C3B6E] rounded-full animate-spin" />
      </div>
    );
  }

  const completed = lessons.filter((l) => l.completed).length;
  const totalVocab = lessons.reduce((sum, l) => sum + (l.key_vocabulary?.length || 0), 0);
  const completedLessons = lessons.filter((l) => l.completed);
  const levelIndex = LEVELS.indexOf(profile.english_level);

  const stats = [
    { label: t('dashboard.lessonsGenerated'), value: lessons.length, icon: BookOpen, color: 'text-[#3C3B6E]' },
    { label: t('dashboard.lessonsCompleted'), value: completed, icon: CheckCircle2, color: 'text-green-600' },
    { label: t('dashboard.wordsLearned'), value: totalVocab, icon: TrendingUp, color: 'text-[#B22234]' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#3C3B6E] flex items-center gap-2">
          <BarChart3 className="w-6 h-6" /> {t('dashboard.title')}
        </h1>
        <p className="text-sm text-slate-500 mt-1">{t('dashboard.subtitle')}</p>
      </div>

      {/* Level card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#3C3B6E] to-[#2e2d5a] p-6 text-white">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#B22234] opacity-10 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/70 text-sm">{t('dashboard.currentLevel')}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-5xl font-bold">{profile.english_level}</span>
                <span className="text-white/60 text-sm">{t('dashboard.of')} {LEVELS[LEVELS.length - 1]}</span>
              </div>
            </div>
            <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center">
              <TrendingUp className="w-8 h-8" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              {LEVELS.map((lvl, i) => (
                <div key={lvl} className="flex-1 space-y-1">
                  <div className={cn('h-2 rounded-full transition-colors', i <= levelIndex ? 'bg-[#B22234]' : 'bg-white/15')} />
                  <span className={cn(
                    'text-[10px] font-bold block text-center',
                    i === levelIndex ? 'text-white' : i < levelIndex ? 'text-white/70' : 'text-white/30'
                  )}>
                    {lvl}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center', stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Completed lessons history */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" /> {t('dashboard.completedHistory')}
        </h2>
        {completedLessons.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-400 text-sm">{t('dashboard.noCompleted')}</p>
            <Link to="/my-lessons" className="text-[#3C3B6E] text-sm font-medium hover:underline mt-1 inline-block">
              {t('dashboard.seeLessons')} →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {completedLessons.slice(0, 8).map((lesson) => (
              <Link
                key={lesson.id}
                to={`/lesson/${lesson.id}`}
                className="flex items-center justify-between bg-white rounded-xl border border-slate-100 p-4 hover:border-[#3C3B6E] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{lesson.title}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <span className="px-1.5 py-0.5 rounded bg-[#3C3B6E]/10 text-[#3C3B6E] font-bold">{lesson.level}</span>
                      <Clock className="w-3 h-3 ml-1" />
                      {new Date(lesson.created_date).toLocaleDateString(lang === 'en' ? 'en' : 'es', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick games */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-3">{t('dashboard.practiceGames')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/word-search" className="group bg-white rounded-2xl border border-slate-100 p-5 hover:border-[#3C3B6E] hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#3C3B6E]/10 flex items-center justify-center">
                <Grid3x3 className="w-5 h-5 text-[#3C3B6E]" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 group-hover:text-[#3C3B6E]">{t('nav.wordsearch')}</p>
                <p className="text-xs text-slate-400">{t('dashboard.wordSearchDesc')}</p>
              </div>
            </div>
          </Link>
          <Link to="/fill-in-the-blanks" className="group bg-white rounded-2xl border border-slate-100 p-5 hover:border-[#B22234] hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#B22234]/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#B22234]" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 group-hover:text-[#B22234]">{t('fillblanks.title')}</p>
                <p className="text-xs text-slate-400">{t('dashboard.fillBlanksDesc')}</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

