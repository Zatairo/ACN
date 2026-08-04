import { useState, useEffect, useCallback, useRef } from 'react';
import { MessagesSquare, Send, Loader2 } from 'lucide-react';
import { messagesApi } from '@/api/lmsClient';
import { LmsPage, Spinner, EmptyState } from '@/components/lms/common';
import { formatFechaHora } from '@/lib/lms-formatters';
import { useI18n } from '@/lib/i18n/index.jsx';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────
// F2.B6 / F2.C6 — Mensajería interna: chat entre estudiante y
// profesora (reutilizado por ambos módulos). El estudiante habla
// con su docente de contacto; el profesor con sus estudiantes.
// ─────────────────────────────────────────────────────────────

export default function Mensajes() {
  const { t, lang } = useI18n();
  const [conversations, setConversations] = useState(null);
  const [activo, setActivo] = useState(null); // { id, nombre }
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const scrollRef = useRef(null);

  const loadConversations = useCallback(async () => {
    try {
      const conv = await messagesApi.conversations();
      setConversations(conv);
    } catch {
      setConversations([]);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Abrir chat con contacto y marcar como leído lo recibido
  const abrirChat = useCallback(async (contacto) => {
    setActivo(contacto);
    setLoadingChat(true);
    try {
      const msgs = await messagesApi.list(contacto.id);
      setMensajes(msgs);
      const pendientes = msgs.filter((m) => m.destinatarioId !== m.remitenteId && m.leido === false);
      // marca los recibidos por mí: el API expone leido=false para los que me enviaron
      const recibidos = msgs.filter((m) => m.remitenteId === contacto.id && !m.leido);
      for (const m of recibidos.slice(0, 5)) {
        await messagesApi.markRead(m.id);
      }
      if (recibidos.length) loadConversations();
    } finally {
      setLoadingChat(false);
    }
  }, [loadConversations]);

  const enviar = async () => {
    if (!texto.trim() || !activo) return;
    setEnviando(true);
    try {
      await messagesApi.send(activo.id, texto.trim());
      setTexto('');
      const msgs = await messagesApi.list(activo.id);
      setMensajes(msgs);
      loadConversations();
    } finally {
      setEnviando(false);
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [mensajes, activo]);

  if (!conversations) return <Spinner />;

  return (
    <div className="space-y-4">
      <LmsPage title={t('lms.messages.title')} subtitle={t('lms.messages.subtitle')} />

      <div className="grid lg:grid-cols-[300px_1fr] gap-4 h-[calc(100vh-220px)] min-h-[420px]">
        {/* Lista de conversaciones */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={MessagesSquare} title={t('lms.messages.noConversations')} />
            </div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.contacto.id}
                onClick={() => abrirChat(c.contacto)}
                className={cn(
                  'w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors',
                  activo?.id === c.contacto.id && 'bg-[#3C3B6E]/5',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800 truncate">{c.contacto.nombre}</p>
                  {c.noLeidos > 0 && (
                    <span className="min-w-[1.25rem] h-5 px-1 rounded-full bg-[#B22234] text-white text-[11px] font-bold flex items-center justify-center">
                      {c.noLeidos}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {c.ultimoMensaje.enviadoPorMi ? `${t('lms.messages.you')}: ` : ''}{c.ultimoMensaje.contenido}
                </p>
                <p className="text-[10px] text-slate-300 mt-0.5">{formatFechaHora(c.ultimoMensaje.fecha, lang)}</p>
              </button>
            ))
          )}
        </div>

        {/* Chat */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col">
          {!activo ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState icon={MessagesSquare} title={t('lms.messages.selectChat')} />
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="font-semibold text-slate-800 text-sm">{activo.nombre}</p>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {loadingChat ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#3C3B6E]" /></div>
                ) : mensajes.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">{t('lms.messages.startChat')}</p>
                ) : (
                  mensajes.map((m) => {
                    const mio = m.remitenteId !== activo.id;
                    return (
                      <div key={m.id} className={cn('flex', mio ? 'justify-end' : 'justify-start')}>
                        <div
                          className={cn(
                            'max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm',
                            mio ? 'bg-[#3C3B6E] text-white rounded-br-sm' : 'bg-slate-100 text-slate-700 rounded-bl-sm',
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.contenido}</p>
                          <p className={cn('text-[10px] mt-1', mio ? 'text-white/60' : 'text-slate-400')}>
                            {formatFechaHora(m.fecha, lang)} {m.tipo !== 'MENSAJE' && `· ${t(`lms.messages.tipo.${m.tipo}`)}`}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={scrollRef} />
              </div>
              <div className="px-4 py-3 border-t border-slate-100 flex items-end gap-2">
                <Textarea
                  rows={2}
                  placeholder={t('lms.messages.writePlaceholder')}
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      enviar();
                    }
                  }}
                  className="flex-1"
                />
                <Button onClick={enviar} disabled={enviando || !texto.trim()} className="shrink-0">
                  {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
