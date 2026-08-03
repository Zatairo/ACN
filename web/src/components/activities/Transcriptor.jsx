import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Volume2, Square } from 'lucide-react';
import { speakWithAccent, stopSpeaking } from '@/lib/tts';
import { useI18n } from '@/lib/i18n/index.jsx';

function compareTexts(original, userText) {
  const clean = (s) => s.toLowerCase().replace(/\[[^\]]*\]/g, ' ').replace(/[.,!?;:"'()]/g, '').split(/\s+/).filter(Boolean);
  const orig = clean(original);
  const user = clean(userText);
  let correct = 0;
  const used = new Set();
  for (const w of user) {
    const idx = orig.findIndex((ow, i) => ow === w && !used.has(i));
    if (idx !== -1) {
      correct++;
      used.add(idx);
    }
  }
  return orig.length ? correct / orig.length : 0;
}

export default function Transcriptor({ data, accent, onComplete }) {
  const { t } = useI18n();
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const utterRef = useRef(null);

  const handlePlay = () => {
    if (playing) {
      stopSpeaking();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    const utt = speakWithAccent(data.script, accent);
    if (utt) {
      utt.onend = () => setPlaying(false);
      utt.onerror = () => setPlaying(false);
    } else {
      setPlaying(false);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const accuracy = compareTexts(data.script, text);
    setTimeout(() => onComplete(accuracy >= 0.6), 2000);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">{t('tr.listenAndType')}</p>

      <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-4">
        <Button onClick={handlePlay} className={cn('rounded-xl', playing ? 'bg-[#B22234] hover:bg-[#9e1e2e]' : 'bg-[#3C3B6E] hover:bg-[#2e2d5a]')}>
          {playing ? <><Square className="w-4 h-4 mr-2" />{t('tr.stop')}</> : <><Volume2 className="w-4 h-4 mr-2" />{t('tr.play')}</>}
        </Button>
        <span className="text-xs text-slate-400">{t('tr.accent')} {accent.toUpperCase()}</span>
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={submitted}
        placeholder={t('tr.typeHere')}
        rows={5}
        className="rounded-xl border-slate-200 focus:border-[#3C3B6E] focus:ring-[#3C3B6E]"
      />

      {submitted && (
        <div className="space-y-2">
          <div className={cn('rounded-xl p-4', compareTexts(data.script, text) >= 0.6 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200')}>
            <p className="text-sm font-semibold text-slate-600 mb-2">{t('tr.originalTranscript')}</p>
            <p className="text-sm text-slate-700">{data.script}</p>
          </div>
          <div className={cn('text-center py-2 rounded-xl font-bold text-sm', compareTexts(data.script, text) >= 0.6 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600')}>
            {t('tr.accuracy', { pct: Math.round(compareTexts(data.script, text) * 100) })} {compareTexts(data.script, text) >= 0.6 ? '✓' : t('tr.tryAgain')}
          </div>
        </div>
      )}

      {!submitted && (
        <Button onClick={handleSubmit} disabled={!text.trim()} className="bg-[#3C3B6E] hover:bg-[#2e2d5a] text-white rounded-xl">
          {t('tr.check')}
        </Button>
      )}
    </div>
  );
}