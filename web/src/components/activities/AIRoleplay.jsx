import { db } from '../../api/base44Client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Send, Loader2, CheckCircle2, Mic } from 'lucide-react';
import { useI18n } from '@/lib/i18n/index.jsx';

export default function AIRoleplay({ data, accent, onComplete }) {
  const { t } = useI18n();
  const [messages, setMessages] = useState(
    data.greeting ? [{ role: 'assistant', content: data.greeting }] : []
  );
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [finished, setFinished] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const userMsg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setSending(true);

    try {
      const conversation = newMessages.map((m) => `${m.role === 'user' ? 'Student' : 'Colleague'}: ${m.content}`).join('\n');
      const res = await db.integrations.Core.InvokeLLM({
        prompt: `${data.system_prompt}

Conversation so far:
${conversation}

Respond as the colleague (1-3 short sentences). Stay in character. The student is at ${data.level || 'B1'} English level.`,
      });

      const reply = typeof res === 'string' ? res : res.content || JSON.stringify(res);
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: '(Connection error. Please continue.)' }]);
    } finally {
      setSending(false);
    }
  };

  const handleFinish = () => {
    setFinished(true);
    onComplete(messages.filter((m) => m.role === 'user').length >= 2);
  };

  const userTurns = messages.filter((m) => m.role === 'user').length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg p-2.5">
        <Mic className="w-3.5 h-3.5 text-[#3C3B6E]" />
        <span>{t('rp.scenario')} {data.scenario}</span>
      </div>

      <div ref={scrollRef} className="h-56 overflow-y-auto space-y-3 bg-slate-50 rounded-xl p-4">
        {messages.map((m, i) => (
          <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div
              className={cn(
                'max-w-[80%] px-3 py-2 rounded-2xl text-sm',
                m.role === 'user' ? 'bg-[#3C3B6E] text-white' : 'bg-white border border-slate-200 text-slate-700'
              )}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 px-3 py-2 rounded-2xl">
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            </div>
          </div>
        )}
      </div>

      {!finished ? (
        <>
          <div className="flex gap-2">
            <label htmlFor="roleplay-input" className="sr-only">{t('rp.placeholder')}</label>
            <input
              id="roleplay-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t('rp.placeholder')}
              className="flex-1 px-3 py-2 rounded-xl border-2 border-slate-200 text-sm focus:border-[#3C3B6E] focus:outline-none"
            />
            <Button onClick={handleSend} disabled={!input.trim() || sending} className="bg-[#3C3B6E] hover:bg-[#2e2d5a] text-white rounded-xl px-3">
              <Send className="w-4 h-4" />
            </Button>
          </div>
          {userTurns >= 2 && (
            <button onClick={handleFinish} className="w-full py-2 rounded-xl text-sm font-bold bg-green-600 hover:bg-green-700 text-white">
              <CheckCircle2 className="w-4 h-4 inline mr-1" /> {t('rp.finish', { turns: userTurns })}
            </button>
          )}
        </>
      ) : (
        <div className="text-center py-3 bg-green-100 rounded-xl text-green-700 font-bold text-sm">
          {t('rp.completed', { turns: userTurns })}
        </div>
      )}
    </div>
  );
}

