import { db } from '../api/base44Client';

import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';

import { BookOpen, Clock, Search, Library, CheckCircle2, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/index.jsx';

const LEVELS = ['all', 'A1', 'A2', 'B1', 'B2', 'C1'];

export default function MyLessons() {
  const { t, lang } = useI18n();
  const { profile, loading } = useOutletContext();
  const [lessons, setLessons] = useState([]);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !profile) return;
    if (profile) loadData();
  }, [loading, profile]);

  const loadData = async () => {
    try {
      const data = await db.entities.Lesson.filter({}, '-created_date', 100);
      setLessons(data);
    } catch {
      /* ignore */
    } finally {
      setLoadingData(false);
    }
  };

  const filtered = lessons.filter((l) => {
    const matchesSearch = (l.title || '').toLowerCase().includes(search.toLowerCase());
    const matchesLevel = levelFilter === 'all' || l.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

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
        <Library className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">{t('lessons.completeOnboarding')}</p>
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#3C3B6E] flex items-center gap-2">
          <Library className="w-6 h-6" /> {t('lessons.title')}
        </h1>
        <p className="text-sm text-slate-500 mt-1">{t('lessons.library', { total: lessons.length })}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('lessons.search')}
            className="pl-9 rounded-xl border-slate-200 focus:border-[#3C3B6E] focus:ring-[#3C3B6E]"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {LEVELS.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={cn(
                'px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors',
                levelFilter === lvl ? 'bg-[#3C3B6E] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              )}
            >
              {lvl === 'all' ? t('common.all') : lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Lessons grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">
            {lessons.length === 0 ? t('lessons.noLessons') : t('lessons.noResults')}
          </p>
          {lessons.length === 0 && (
            <Link to="/" className="text-[#3C3B6E] text-sm font-medium hover:underline mt-1 inline-block">
              {t('lessons.generateFirst')} →
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((lesson) => (
            <Link
              key={lesson.id}
              to={`/lesson/${lesson.id}`}
              className="group bg-white rounded-2xl border border-slate-100 p-5 hover:border-[#3C3B6E] hover:shadow-md transition-all flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-[#3C3B6E]/10 text-[#3C3B6E]">{lesson.level}</span>
                {lesson.completed ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {t('lessons.completedBadge')}
                  </span>
                ) : (
                  <span className="text-xs font-medium text-slate-400">{t('lessons.inProgress')}</span>
                )}
              </div>
              <h3 className="font-semibold text-slate-800 group-hover:text-[#3C3B6E] transition-colors line-clamp-2 flex-1">
                {lesson.title}
              </h3>
              {lesson.key_vocabulary?.length > 0 && (
                <p className="text-xs text-slate-400 mt-2">{t('lessons.keyWords', { count: lesson.key_vocabulary.length })}</p>
              )}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(lesson.created_date).toLocaleDateString(lang === 'en' ? 'en' : 'es', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#3C3B6E] transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

