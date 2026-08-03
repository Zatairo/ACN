import { db } from '../../api/base44Client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n/index.jsx';

export default function ImageToWord({ data, onComplete }) {
  const { t } = useI18n();
  const [imageUrl, setImageUrl] = useState(data.image_url || null);
  const [loading, setLoading] = useState(!imageUrl);
  const [word, setWord] = useState('');
  const [sentence, setSentence] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!imageUrl && data.image_prompt) {
      generateImage();
    }
  }, []);

  const generateImage = async () => {
    setLoading(true);
    try {
      const res = await db.integrations.Core.GenerateImage({ prompt: data.image_prompt });
      setImageUrl(res.url);
    } catch {
      /* error */
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const wordCorrect = word.trim().toLowerCase() === (data.answer || '').trim().toLowerCase();
    const sentenceValid = sentence.trim().toLowerCase().includes((data.answer || '').toLowerCase()) && sentence.trim().length > 15;
    const passed = wordCorrect && sentenceValid;
    setTimeout(() => onComplete(passed), 2500);
  };

  return (
    <div className="space-y-4">
      <div className="aspect-video rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt={t('i2w.whatIsThis')} className="w-full h-full object-cover" />
        ) : (
          <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
        )}
      </div>

      {loading && <p className="text-sm text-slate-400 text-center">{t('i2w.generating')}</p>}

      <div className="space-y-3">
        <div>
          <Label className="text-xs font-semibold text-slate-600">{t('i2w.whatIsThis')}</Label>
          <Input
            value={word}
            onChange={(e) => setWord(e.target.value)}
            disabled={submitted || loading}
            placeholder={t('i2w.whatIsThis')}
            className={cn(
              'mt-1 rounded-lg border-slate-200',
              submitted && !loading && (word.trim().toLowerCase() === data.answer?.toLowerCase() ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50')
            )}
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-slate-600">{t('i2w.writeSentence')}</Label>
          <Textarea
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            disabled={submitted || loading}
            placeholder={t('i2w.sentencePlaceholder')}
            rows={2}
            className="mt-1 rounded-lg border-slate-200"
          />
        </div>
      </div>

      {submitted && (
        <div className={cn('rounded-xl p-3 text-sm', word.trim().toLowerCase() === data.answer?.toLowerCase() ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600')}>
          {t('i2w.answer')} <strong>{data.answer}</strong>
        </div>
      )}

      {!submitted && (
        <Button onClick={handleSubmit} disabled={loading} className="bg-[#3C3B6E] hover:bg-[#2e2d5a] text-white rounded-xl">
          {t('i2w.check')}
        </Button>
      )}
    </div>
  );
}

