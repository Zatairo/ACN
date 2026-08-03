import { db } from '../api/base44Client';

import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { User, Briefcase, MapPin, Users, Target, Calendar, Check, Save } from 'lucide-react';
import { useI18n } from '@/lib/i18n/index.jsx';

export default function Profile() {
  const { t } = useI18n();
  const { profile, loading, refetchProfile } = useOutletContext();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile && !form) {
      setForm({
        profession: profile.profession || '',
        motivation: profile.motivation || '',
        learning_goals: profile.learning_goals || '',
      });
    }
  }, [profile]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await db.entities.StudentProfile.update(profile.id, {
        profession: form.profession,
        motivation: form.motivation,
        learning_goals: form.learning_goals,
      });
      await refetchProfile?.();
      setSaved(true);
    } catch {
      /* error bubbles */
    } finally {
      setSaving(false);
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
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">{t('profile.completeOnboarding')}</p>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#3C3B6E] rounded-full animate-spin" />
      </div>
    );
  }

  const readOnly = [
    { label: t('profile.name'), icon: User, value: profile.full_name },
    { label: t('profile.age'), icon: Calendar, value: profile.age || '—' },
    { label: t('profile.location'), icon: MapPin, value: profile.location || '—' },
    { label: t('profile.family'), icon: Users, value: profile.family_composition || '—' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#3C3B6E] flex items-center gap-2">
          <User className="w-6 h-6" /> {t('profile.title')}
        </h1>
        <p className="text-sm text-slate-500 mt-1">{t('profile.subtitle')}</p>
      </div>

      {/* Read-only info */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-700">{t('profile.personalInfo')}</h2>
          <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-[#3C3B6E]">{t('profile.level')} {profile.english_level}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {readOnly.map((item) => (
            <div key={item.label} className="flex items-center gap-2.5 bg-slate-50 rounded-lg px-3 py-2.5">
              <item.icon className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{item.label}</p>
                <p className="text-sm font-medium text-slate-700">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editable */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <h2 className="font-bold text-slate-700 flex items-center gap-2">
          <Target className="w-4 h-4 text-[#B22234]" /> {t('profile.aiPersonalization')}
        </h2>
        <p className="text-xs text-slate-400 -mt-2">{t('profile.aiContext')}</p>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5" /> {t('profile.profession')}
          </Label>
          <Input
            value={form.profession}
            onChange={(e) => handleChange('profession', e.target.value)}
            placeholder="Ingeniero"
            className="rounded-lg border-slate-200 focus:border-[#3C3B6E] focus:ring-[#3C3B6E]"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" /> {t('profile.motivation')}
          </Label>
          <Textarea
            value={form.motivation}
            onChange={(e) => handleChange('motivation', e.target.value)}
            placeholder="Quiero trabajar en una empresa bilingüe de ingeniería..."
            rows={3}
            className="rounded-lg border-slate-200 focus:border-[#3C3B6E] focus:ring-[#3C3B6E]"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" /> {t('profile.learningGoals')}
          </Label>
          <Textarea
            value={form.learning_goals}
            onChange={(e) => handleChange('learning_goals', e.target.value)}
            placeholder={t('profile.goalsPlaceholder')}
            rows={3}
            className="rounded-lg border-slate-200 focus:border-[#3C3B6E] focus:ring-[#3C3B6E]"
          />
          <p className="text-xs text-slate-400">
            {t('profile.describeSkills')}
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} disabled={saving} className="bg-[#3C3B6E] hover:bg-[#2e2d5a] text-white rounded-xl font-semibold">
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />{t('profile.saving')}</>
            ) : (
              <><Save className="w-4 h-4 mr-2" />{t('profile.saveChanges')}</>
            )}
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
              <Check className="w-4 h-4" /> {t('profile.updated')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

