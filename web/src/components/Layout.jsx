import { db } from '../api/base44Client';

import { Outlet, Link, useLocation } from 'react-router-dom';

import { useEffect, useState, useCallback } from 'react';
import { Home as HomeIcon, Grid3x3, LogOut, BookOpen, BarChart3, FileText, User as UserIcon, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/index.jsx';
import LangSelector from '@/components/LangSelector.jsx';
import Isotype from '@/components/brand/Isotype';

export default function Layout() {
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const { t } = useI18n();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const me = await db.auth.me();
      setUser(me);
      const profiles = await db.entities.StudentProfile.filter({ created_by_id: me.id });
      setProfile(profiles.length > 0 ? profiles[0] : null);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, location.pathname]);

  const handleLogout = async () => {
    await db.auth.logout();
    window.location.href = '/login';
  };

  const navItems = [
    { label: t('nav.home'), path: '/', icon: HomeIcon },
    { label: t('nav.lessons'), path: '/my-lessons', icon: BookOpen },
    { label: t('nav.progress'), path: '/dashboard', icon: BarChart3 },
    { label: t('nav.wordsearch'), path: '/word-search', icon: Grid3x3 },
    { label: t('nav.fillblanks'), path: '/fill-in-the-blanks', icon: FileText },
    { label: t('nav.profile'), path: '/profile', icon: UserIcon },
    ...(user?.role === 'admin' ? [{ label: t('nav.settings'), path: '/admin', icon: Settings }] : []),
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2.5">
              <Isotype />
              <div className="flex flex-col leading-none">
                <span className="font-bold text-lg tracking-tight text-brand-blue">
                  ACN Institute
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">{t('app.englishPlatform')}</span>
              </div>
            </Link>

            <nav className="flex items-center gap-0.5 overflow-x-auto">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0',
                    isActive(item.path) ? 'bg-[#3C3B6E] text-white' : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <LangSelector variant="dark" />
              {profile?.english_level && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold text-white bg-[#B22234]">
                  {profile.english_level}
                </span>
              )}
              {user && (
                <span className="text-sm font-medium text-slate-600 hidden md:block">
                  {profile?.full_name || user.email}
                </span>
              )}
              <button onClick={handleLogout} aria-label={t('nav.logout')} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet context={{ profile, loading, user, refetchProfile: loadData }} />
      </main>
    </div>
  );
}

