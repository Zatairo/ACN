import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n/index.jsx';

export default function VisualStorytelling({ data, onComplete }) {
  const { t } = useI18n();
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState(false);

  const images = data.image_urls || [];
  const prompts = data.image_prompts || [];
  const options = data.options || [];

  const handleCheck = () => {
    setChecked(true);
    const passed = selected === data.answer;
    setTimeout(() => onComplete(passed), 1500);
  };

  return (
    <div className="space-y-4">
      <div className="text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 rounded-xl p-4 text-[15px]">
        {data.story}
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {images.map((url, i) => (
            <div key={i} className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100">
              <img src={url} alt={`Visual ${i + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && prompts.length > 0 && (
        <div className="grid gap-2">
          {prompts.map((prompt, i) => (
            <div key={i} className="bg-slate-50 rounded-lg px-4 py-2.5 text-xs text-slate-600 italic">
              {t('vs.scene')} {i + 1}: {prompt}
            </div>
          ))}
        </div>
      )}

      {options.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700">{data.comprehension_question}</p>
          <div className="grid gap-2">
            {options.map((opt, i) => {
              const isAnswer = opt === data.answer;
              const isSelected = selected === opt;
              return (
                <button
                  key={i}
                  onClick={() => !checked && setSelected(opt)}
                  className={cn(
                    'text-left px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all',
                    !checked && isSelected && 'border-[#3C3B6E] bg-[#3C3B6E]/5',
                    !checked && !isSelected && 'border-slate-200 hover:border-slate-300',
                    checked && isAnswer && 'border-green-500 bg-green-50 text-green-700',
                    checked && isSelected && !isAnswer && 'border-red-500 bg-red-50 text-red-700'
                  )}
                >
                  <span className="flex items-center justify-between">
                    {opt}
                    {checked && isAnswer && <Check className="w-4 h-4" />}
                    {checked && isSelected && !isAnswer && <X className="w-4 h-4" />}
                  </span>
                </button>
              );
            })}
          </div>
          <Button
            onClick={handleCheck}
            disabled={selected === null || checked}
            className="bg-[#3C3B6E] hover:bg-[#2e2d5a] text-white rounded-xl"
          >
            {t('vs.check')}
          </Button>
        </div>
      )}
    </div>
  );
}