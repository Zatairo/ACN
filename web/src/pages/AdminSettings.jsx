import { db } from '../api/base44Client';

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Users, UserPlus, BookOpen, ChevronLeft, Save, Check, Power, ShieldAlert, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/index.jsx';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

export default function AdminSettings() {
  const { t } = useI18n();
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState([]);
  const [profilesByUser, setProfilesByUser] = useState({});
  const [lessonsByUser, setLessonsByUser] = useState({});

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [editingLessonId, setEditingLessonId] = useState(null);

  const [form, setForm] = useState({ name: '', email: '', password: '', level: 'A2', profession: '' });
  const [creating, setCreating] = useState(false);

  const [draft, setDraft] = useState(null);
  const [savingMeta, setSavingMeta] = useState(false);
  const [savingIdx, setSavingIdx] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const current = await db.auth.me();
      setMe(current);
      if (current.role !== 'admin') {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      setIsAdmin(true);

      const allUsers = await db.auth.listUsers();
      const profiles = await db.entities.StudentProfile.filter({});
      const lessons = await db.entities.Lesson.filter({}, '-created_date');

      const pMap = {};
      profiles.forEach((p) => {
        pMap[p.created_by_id] = p;
      });
      const lMap = {};
      lessons.forEach((l) => {
        lMap[l.created_by_id] = lMap[l.created_by_id] || [];
        lMap[l.created_by_id].push(l);
      });

      setUsers(allUsers);
      setProfilesByUser(pMap);
      setLessonsByUser(lMap);
    } catch {
      /* error bubbles */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = async () => {
    const allUsers = await db.auth.listUsers();
    const profiles = await db.entities.StudentProfile.filter({});
    const lessons = await db.entities.Lesson.filter({}, '-created_date');
    const pMap = {};
    profiles.forEach((p) => {
      pMap[p.created_by_id] = p;
    });
    const lMap = {};
    lessons.forEach((l) => {
      lMap[l.created_by_id] = lMap[l.created_by_id] || [];
      lMap[l.created_by_id].push(l);
    });
    setUsers(allUsers);
    setProfilesByUser(pMap);
    setLessonsByUser(lMap);
  };

  const toggleEnabled = async (user) => {
    try {
      await db.auth.updateUser(user.id, { enabled: user.enabled === false });
      await refresh();
      toast({ title: user.enabled === false ? t('admin.enabled') : t('admin.disabled') });
    } catch {
      toast({ title: t('admin.error') });
    }
  };

  const createStudent = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const user = await db.auth.createUser({
        email: form.email,
        password: form.password,
        name: form.name,
      });
      await db.entities.StudentProfile.create({
        created_by_id: user.id,
        full_name: form.name,
        english_level: form.level,
        profession: form.profession,
        onboarding_completed: true,
      });
      setForm({ name: '', email: '', password: '', level: 'A2', profession: '' });
      await refresh();
      toast({ title: t('admin.studentCreated'), description: t('admin.studentCreatedDesc') });
    } catch (err) {
      toast({ title: t('admin.error'), description: err.message || '' });
    } finally {
      setCreating(false);
    }
  };

  const openLesson = (lesson) => {
    setEditingLessonId(lesson.id);
    const activities = (lesson.activities || []).map((a) => ({
      raw: JSON.stringify(a.data ?? {}, null, 2),
      parsed: a.data ?? {},
    }));
    setDraft({
      id: lesson.id,
      title: lesson.title || '',
      level: lesson.level || 'A2',
      reading_text: lesson.reading_text || '',
      listening_script: lesson.listening_script || '',
      writing_prompt: lesson.writing_prompt || '',
      speaking_instructions: lesson.speaking_instructions || '',
      key_vocabulary: (lesson.key_vocabulary || []).join(', '),
      activities,
    });
  };

  const updateDraft = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));

  const updateActivity = (idx, key, value) => {
    setDraft((prev) => {
      const activities = prev.activities.map((a, i) => (i === idx ? { ...a, [key]: value } : a));
      return { ...prev, activities };
    });
  };

  const parseActivity = (a) => {
    try {
      return { valid: true, data: JSON.parse(a.raw) };
    } catch {
      return { valid: false, data: null };
    }
  };

  const saveLessonMeta = async () => {
    setSavingMeta(true);
    try {
      await db.entities.Lesson.update(draft.id, {
        title: draft.title,
        level: draft.level,
        reading_text: draft.reading_text,
        listening_script: draft.listening_script,
        writing_prompt: draft.writing_prompt,
        speaking_instructions: draft.speaking_instructions,
        key_vocabulary: draft.key_vocabulary
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      });
      toast({ title: t('admin.saved') });
    } catch {
      toast({ title: t('admin.error') });
    } finally {
      setSavingMeta(false);
    }
  };

  const saveActivity = async (idx) => {
    const { valid } = parseActivity(draft.activities[idx]);
    if (!valid) {
      toast({ title: t('admin.invalidJson') });
      return;
    }
    setSavingIdx(idx);
    try {
      const updated = draft.activities.map((a, i) =>
        i === idx
          ? { ...(a.parsed && typeof a.parsed === 'object' ? a.parsed : {}), ...parseActivity(a).data }
          : a.parsed
      );
      await db.entities.Lesson.update(draft.id, { activities: updated });
      setDraft((prev) => ({
        ...prev,
        activities: prev.activities.map((a, i) => (i === idx ? { ...a, parsed: updated[i] } : a)),
      }));
      toast({ title: t('admin.saved') });
    } catch {
      toast({ title: t('admin.error') });
    } finally {
      setSavingIdx(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#3C3B6E] animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">{t('admin.adminRequired')}</p>
      </div>
    );
  }

  const selectedUser = users.find((u) => u.id === selectedUserId);
  const selectedLessons = selectedUserId ? lessonsByUser[selectedUserId] || [] : [];
  const editingLesson = editingLessonId ? selectedLessons.find((l) => l.id === editingLessonId) : null;

  if (editingLessonId && draft) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setEditingLessonId(null);
              setDraft(null);
            }}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#3C3B6E]"
          >
            <ChevronLeft className="w-4 h-4" /> {t('admin.backToStudents')}
          </button>
          <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-[#3C3B6E]">{draft.level}</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-[#3C3B6E]">{t('admin.editLesson')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('admin.selectedStudent')} {selectedUser?.name || selectedUser?.email}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">{t('admin.lessonTitle')}</Label>
            <Input value={draft.title} onChange={(e) => updateDraft('title', e.target.value)} className="rounded-lg border-slate-200" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">{t('admin.level')}</Label>
            <select
              value={draft.level}
              onChange={(e) => updateDraft('level', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm focus:border-[#3C3B6E] focus:outline-none bg-white"
            >
              {LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">{t('admin.keyVocabulary')}</Label>
            <Input value={draft.key_vocabulary} onChange={(e) => updateDraft('key_vocabulary', e.target.value)} className="rounded-lg border-slate-200" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">{t('admin.reading')}</Label>
            <Textarea value={draft.reading_text} onChange={(e) => updateDraft('reading_text', e.target.value)} rows={4} className="rounded-lg border-slate-200" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">{t('admin.listening')}</Label>
            <Textarea value={draft.listening_script} onChange={(e) => updateDraft('listening_script', e.target.value)} rows={4} className="rounded-lg border-slate-200" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">{t('admin.writing')}</Label>
            <Textarea value={draft.writing_prompt} onChange={(e) => updateDraft('writing_prompt', e.target.value)} rows={3} className="rounded-lg border-slate-200" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">{t('admin.speaking')}</Label>
            <Textarea value={draft.speaking_instructions} onChange={(e) => updateDraft('speaking_instructions', e.target.value)} rows={3} className="rounded-lg border-slate-200" />
          </div>
          <Button onClick={saveLessonMeta} disabled={savingMeta} className="bg-[#3C3B6E] hover:bg-[#2e2d5a] text-white rounded-xl">
            {savingMeta ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('admin.saving')}</> : <><Save className="w-4 h-4 mr-2" />{t('admin.saveLesson')}</>}
          </Button>
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#3C3B6E]" /> {t('admin.activities')} ({draft.activities.length})
          </h2>
          <div className="space-y-3">
            {draft.activities.map((a, idx) => {
              const { valid } = parseActivity(a);
              return (
                <div key={idx} className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
                  <details>
                    <summary className="cursor-pointer text-sm font-bold text-slate-700 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-[#3C3B6E]/10 text-[#3C3B6E]">{idx + 1}</span>
                      <span className="truncate">{a.title || a.parsed?.type || `Activity ${idx + 1}`}</span>
                      <span className="ml-auto text-xs text-slate-400 shrink-0">{a.parsed?.type}</span>
                    </summary>
                    <div className="mt-3 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-600">{t('admin.activityTitle')}</Label>
                          <Input value={a.title ?? ''} onChange={(e) => updateActivity(idx, 'title', e.target.value)} className="rounded-lg border-slate-200" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-600">{t('admin.activityInstructions')}</Label>
                          <Input value={a.instructions ?? ''} onChange={(e) => updateActivity(idx, 'instructions', e.target.value)} className="rounded-lg border-slate-200" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">{t('admin.activityData')}</Label>
                        <Textarea
                          value={a.raw}
                          onChange={(e) => updateActivity(idx, 'raw', e.target.value)}
                          rows={6}
                          className={cn('rounded-lg font-mono text-xs', !valid && 'border-red-400 bg-red-50')}
                        />
                      </div>
                      <Button onClick={() => saveActivity(idx)} disabled={savingIdx === idx} variant="outline" className="rounded-xl border-slate-200 text-[#3C3B6E]">
                        {savingIdx === idx ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                        {t('admin.saveActivity')}
                      </Button>
                    </div>
                  </details>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (selectedUserId) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <button
          onClick={() => setSelectedUserId(null)}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#3C3B6E]"
        >
          <ChevronLeft className="w-4 h-4" /> {t('admin.backToStudents')}
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#3C3B6E]">{t('admin.selectedStudent')} {selectedUser?.name || selectedUser?.email}</h1>
          <p className="text-sm text-slate-500 mt-1">{selectedUser?.email}</p>
        </div>
        {selectedLessons.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">{t('admin.noLessons')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {selectedLessons.map((lesson) => (
              <button
                key={lesson.id}
                onClick={() => openLesson(lesson)}
                className="text-left bg-white rounded-2xl border border-slate-100 p-5 hover:border-[#3C3B6E] hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-[#3C3B6E]/10 text-[#3C3B6E]">{lesson.level}</span>
                  <span className="text-xs text-slate-400">{(lesson.activities || []).length} {t('admin.activities').toLowerCase()}</span>
                </div>
                <p className="font-semibold text-slate-800">{lesson.title}</p>
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> {t('admin.editLesson')} →
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  const studentRows = users.filter((u) => u.role === 'user' || u.role === 'admin');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#3C3B6E] flex items-center gap-2">
          <Settings className="w-6 h-6" /> {t('admin.title')}
        </h1>
        <p className="text-sm text-slate-500 mt-1">{t('admin.subtitle')}</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h2 className="font-bold text-slate-700 flex items-center gap-2 mb-4">
          <UserPlus className="w-4 h-4 text-[#B22234]" /> {t('admin.createStudent')}
        </h2>
        <form onSubmit={createStudent} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">{t('admin.name')}</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="rounded-lg border-slate-200" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">{t('admin.email')}</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="rounded-lg border-slate-200" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">{t('admin.password')}</Label>
            <Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required className="rounded-lg border-slate-200" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">{t('admin.level')}</Label>
            <select
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm focus:border-[#3C3B6E] focus:outline-none bg-white"
            >
              {LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">{t('admin.profession')}</Label>
            <Input value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })} className="rounded-lg border-slate-200" />
          </div>
          <div className="sm:col-span-2 lg:col-span-5">
            <Button type="submit" disabled={creating} className="bg-[#3C3B6E] hover:bg-[#2e2d5a] text-white rounded-xl">
              {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('admin.creating')}</> : <><UserPlus className="w-4 h-4 mr-2" />{t('admin.create')}</>}
            </Button>
          </div>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Users className="w-5 h-5 text-[#3C3B6E]" /> {t('admin.students')} ({studentRows.length})
        </h2>
        {studentRows.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">{t('admin.noStudents')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {studentRows.map((u) => {
              const profile = profilesByUser[u.id];
              const lessons = lessonsByUser[u.id] || [];
              const enabled = u.enabled !== false;
              return (
                <div key={u.id} className="flex items-center justify-between bg-white rounded-xl border border-slate-100 p-4 hover:border-slate-200 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0', enabled ? 'bg-[#3C3B6E]' : 'bg-slate-300')}>
                      {(u.name || u.email || '?')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{u.name || u.email}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {u.email} · {profile?.english_level || t('admin.noProfile')} · {lessons.length} {t('admin.lessons').toLowerCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase', enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600')}>
                      {enabled ? t('admin.enabled') : t('admin.disabled')}
                    </span>
                    <button
                      onClick={() => toggleEnabled(u)}
                      aria-label={t('admin.toggleEnable')}
                      className={cn('p-2 rounded-lg transition-colors', enabled ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50')}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedUserId(u.id)}
                      className="px-3 py-2 rounded-lg text-xs font-bold text-white bg-[#3C3B6E] hover:bg-[#2e2d5a]"
                    >
                      {t('admin.lessons')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
