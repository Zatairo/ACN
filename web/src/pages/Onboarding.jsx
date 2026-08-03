import { db } from '../api/base44Client';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import ProfileForm from '@/components/onboarding/ProfileForm';
import LevelTest from '@/components/onboarding/LevelTest';
import LangSelector from '@/components/LangSelector';
import { useI18n } from '@/lib/i18n/index.jsx';

export default function Onboarding() {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [profileData, setProfileData] = useState(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleProfileSubmit = (data) => {
    setProfileData(data);
    setStep(1);
  };

  const handleLevelComplete = async (computedLevel) => {
    setSaving(true);
    try {
      await db.entities.StudentProfile.create({
        ...profileData,
        english_level: computedLevel,
        onboarding_completed: true,
      });
      navigate('/');
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex flex-col">
      <div className="px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3C3B6E] to-[#B22234] flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg">
            <span className="text-[#3C3B6E]">US</span><span className="text-[#B22234]">-</span><span className="text-[#3C3B6E]">Learn</span>
          </span>
        </div>
        <LangSelector variant="dark" />
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 py-2">
        <div className="flex items-center gap-2">
          <div className={cn('flex-1 h-1.5 rounded-full transition-colors', step >= 0 ? 'bg-[#3C3B6E]' : 'bg-slate-200')} />
          <div className={cn('flex-1 h-1.5 rounded-full transition-colors', step >= 1 ? 'bg-[#3C3B6E]' : 'bg-slate-200')} />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-xs font-medium text-slate-500">{t('onboarding.step1')}</span>
          <span className="text-xs font-medium text-slate-500">{t('onboarding.step2')}</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-2xl">
          {step === 0 && <ProfileForm onSubmit={handleProfileSubmit} />}
          {step === 1 && <LevelTest onComplete={handleLevelComplete} saving={saving} />}
        </div>
      </div>
    </div>
  );
}

