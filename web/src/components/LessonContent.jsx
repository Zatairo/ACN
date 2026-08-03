import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Headphones, Pen, Mic, Volume2, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/index.jsx';

export default function LessonContent({ lesson }) {
  const { t } = useI18n();
  const [speaking, setSpeaking] = useState(false);

  const speak = (text) => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const cleanText = text.replace(/\[pause\]/g, '. ').replace(/\*/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const renderHighlightedText = (text, vocabulary) => {
    if (!text) return null;
    const words = text.split(/(\s+)/);
    return words.map((word, i) => {
      const clean = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
      if (vocabulary?.some((v) => v.toLowerCase() === clean)) {
        return (
          <mark key={i} className="bg-[#B22234]/10 text-[#B22234] px-0.5 rounded font-semibold">
            {word}
          </mark>
        );
      }
      return <span key={i}>{word}</span>;
    });
  };

  const vocab = lesson.key_vocabulary || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="px-3 py-1 rounded-full text-sm font-bold text-white bg-[#3C3B6E]">{lesson.level}</span>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">{lesson.title}</h1>
      </div>

      {vocab.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {vocab.map((word, i) => (
            <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600">
              {word}
            </span>
          ))}
        </div>
      )}

      <Tabs defaultValue="reading" className="w-full">
        <TabsList className="grid grid-cols-4 w-full bg-slate-100 rounded-xl p-1 h-auto">
          {[
            { value: 'reading', icon: BookOpen, label: 'Reading' },
            { value: 'listening', icon: Headphones, label: 'Listening' },
            { value: 'writing', icon: Pen, label: 'Writing' },
            { value: 'speaking', icon: Mic, label: 'Speaking' },
          ].map(({ value, icon: Icon, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="rounded-lg py-2 data-[state=active]:bg-white data-[state=active]:text-[#3C3B6E] flex flex-col items-center gap-1 text-xs"
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="reading" className="mt-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 text-[#3C3B6E]" /> Reading
            </h3>
            <div className="text-slate-700 leading-relaxed whitespace-pre-wrap text-[15px]">
              {renderHighlightedText(lesson.reading_text, vocab)}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="listening" className="mt-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <Headphones className="w-4 h-4 text-[#3C3B6E]" /> Listening
              </h3>
              <Button
                onClick={() => speak(lesson.listening_script)}
                className={cn('rounded-xl', speaking ? 'bg-[#B22234] hover:bg-[#9e1e2e]' : 'bg-[#3C3B6E] hover:bg-[#2e2d5a]')}
              >
                {speaking ? (
                  <><Square className="w-4 h-4 mr-1.5" />{t('tr.stop')}</>
                ) : (
                  <><Volume2 className="w-4 h-4 mr-1.5" />{t('lesson.playAudio')}</>
                )}
              </Button>
            </div>
            <div className="text-sm text-slate-500 italic bg-slate-50 rounded-xl p-4 whitespace-pre-wrap">
              {lesson.listening_script}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="writing" className="mt-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <Pen className="w-4 h-4 text-[#3C3B6E]" /> Writing
            </h3>
            <div className="text-sm text-slate-700 bg-slate-50 rounded-xl p-4 whitespace-pre-wrap">
              {lesson.writing_prompt}
            </div>
            <Textarea
              placeholder={t('lesson.writeHere')}
              rows={8}
              className="rounded-xl border-slate-200 focus:border-[#3C3B6E] focus:ring-[#3C3B6E]"
            />
          </div>
        </TabsContent>

        <TabsContent value="speaking" className="mt-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <Mic className="w-4 h-4 text-[#3C3B6E]" /> Speaking / Pronunciation
            </h3>
            <div className="text-sm text-slate-700 bg-slate-50 rounded-xl p-4 whitespace-pre-wrap">
              {lesson.speaking_instructions}
            </div>
            <Button
              onClick={() => speak(lesson.speaking_instructions)}
              className={cn('rounded-xl', speaking ? 'bg-[#B22234] hover:bg-[#9e1e2e]' : 'bg-[#3C3B6E] hover:bg-[#2e2d5a]')}
            >
              {speaking ? (
                <><Square className="w-4 h-4 mr-1.5" />{t('tr.stop')}</>
              ) : (
                <><Volume2 className="w-4 h-4 mr-1.5" />{t('lesson.listenInstructions')}</>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}