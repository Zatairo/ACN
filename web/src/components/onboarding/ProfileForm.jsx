import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { User, Briefcase, MapPin, Users, Target, Calendar } from 'lucide-react';
import { useI18n } from '@/lib/i18n/index.jsx';

export default function ProfileForm({ onSubmit }) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    full_name: '', age: '', profession: '', location: '', family_composition: '', motivation: '',
  });

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) return;
    onSubmit({ ...form, age: form.age ? parseInt(form.age) : null });
  };

  const fields = [
    { key: 'full_name', label: t('onboarding.fullName'), icon: User, type: 'text', placeholder: 'Juan Pérez', required: true },
    { key: 'age', label: t('onboarding.age'), icon: Calendar, type: 'number', placeholder: '40' },
    { key: 'profession', label: t('onboarding.profession'), icon: Briefcase, type: 'text', placeholder: 'Ingeniero' },
    { key: 'location', label: t('onboarding.location'), icon: MapPin, type: 'text', placeholder: 'Medellín, Colombia' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-[#3C3B6E]">{t('onboarding.tellUsAboutYou')}</h1>
        <p className="text-sm text-slate-500 mt-1">{t('onboarding.profilePersonalizes')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map(({ key, label, icon: Icon, type, placeholder, required }) => (
          <div key={key} className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5" />
              {label}{required && <span className="text-[#B22234]">*</span>}
            </Label>
            <Input
              type={type}
              value={form[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder={placeholder}
              className="rounded-lg border-slate-200 focus:border-[#3C3B6E] focus:ring-[#3C3B6E]"
              required={required}
            />
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          {t('onboarding.family')}
        </Label>
        <Input
          value={form.family_composition}
          onChange={(e) => handleChange('family_composition', e.target.value)}
          placeholder="Casado, 2 hijos"
          className="rounded-lg border-slate-200 focus:border-[#3C3B6E] focus:ring-[#3C3B6E]"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5" />
          {t('onboarding.motivation')}
        </Label>
        <Textarea
          value={form.motivation}
          onChange={(e) => handleChange('motivation', e.target.value)}
          placeholder={t('onboarding.motivationPlaceholder')}
          rows={3}
          className="rounded-lg border-slate-200 focus:border-[#3C3B6E] focus:ring-[#3C3B6E]"
        />
      </div>

      <Button type="submit" className="w-full bg-[#3C3B6E] hover:bg-[#2e2d5a] text-white rounded-xl py-2.5 font-semibold">
        {t('onboarding.continueToLevelTest')}
      </Button>
    </form>
  );
}