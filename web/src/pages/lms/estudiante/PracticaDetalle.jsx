import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, X, Trophy, Loader2, RefreshCw } from 'lucide-react';
import { activitiesApi } from '@/api/lmsClient';
import { Spinner } from '@/components/lms/common';
import { useI18n } from '@/lib/i18n/index.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generateWordSearch } from '@/lib/wordSearchGenerator';
import WordSearchGrid from '@/components/wordsearch/WordSearchGrid';

// ─────────────────────────────────────────────────────────────
// F2.B4 — Ejecutor de prácticas: FILL_BLANKS, WORD_SEARCH, QUIZ
// y LISTENING con datos de /api/activities. Al terminar registra
// el intento (POST /activities/:id/attempts) para el progreso.
// ─────────────────────────────────────────────────────────────

export default function EstudiantePracticaDetalle() {
  const { id } = useParams();
  const { t, lang } = useI18n();
  const [activity, setActivity] = useState(null);
  const [estado, setEstado] = useState('pendiente'); // pendiente | hecho
  const [puntaje, setPuntaje] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  // Estado interno según tipo
  const [respuestas, setRespuestas] = useState({});
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizSel, setQuizSel] = useState(null);
  const [wordGame, setWordGame] = useState(null);
  const [wordFound, setWordFound] = useState(0);

  const load = useCallback(async () => {
    const list = await activitiesApi.list();
    setActivity(list.find((a) => a.id === Number(id)) ?? null);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (activity?.tipo === 'WORD_SEARCH') {
      const palabras = (activity.contenidoJson?.palabras ?? []).filter((w) => /^[a-zA-Z]+$/.test(w));
      setWordGame(generateWordSearch(palabras.length >= 4 ? palabras : ['english', 'school', 'family', 'time', 'work']));
    }
  }, [activity]);

  if (!activity) return <Spinner />;
  const data = activity.contenidoJson ?? {};
  const totalPreguntas = data.preguntas?.length ?? 0;

  const calificar = () => {
    let score = 0;
    let total = 0;
    if (activity.tipo === 'FILL_BLANKS') {
      const ejercicios = data.ejercicios ?? [];
      total = ejercicios.length;
      score = ejercicios.filter((ex, i) =>
        String(respuestas[i] ?? '').trim().toLowerCase() === String(ex.answer).trim().toLowerCase(),
      ).length;
    } else if (activity.tipo === 'QUIZ') {
      total = data.preguntas.length;
      score = data.preguntas.filter((p, i) => quizIdx >= 0 && respuestas[i] === p.respuesta).length;
    } else if (activity.tipo === 'LISTENING') {
      total = data.preguntas.length;
      score = data.preguntas.filter((p, i) =>
        String(respuestas[i] ?? '').trim().toLowerCase() === String(p.respuesta).trim().toLowerCase(),
      ).length;
    } else if (activity.tipo === 'WORD_SEARCH') {
      total = data.palabras?.length ?? 0;
      score = wordFound;
    }
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    setPuntaje(pct);
    setEstado('hecho');
    setQuizIdx(totalPreguntas); // cierra el quiz
  };

  const terminarYGuardar = async () => {
    setEnviando(true);
    try {
      await activitiesApi.submitAttempt(activity.id, { puntaje, respuestasJson: respuestas });
      setEnviado(true);
    } catch {
      /* si falla el registro, igual se muestra el resultado */
      setEnviado(true);
    } finally {
      setEnviando(false);
    }
  };

  const reiniciar = () => {
    setRespuestas({});
    setQuizIdx(0);
    setQuizSel(null);
    setWordFound(0);
    setEstado('pendiente');
    setEnviado(false);
    if (activity.tipo === 'WORD_SEARCH') {
      const palabras = (data.palabras ?? []).filter((w) => /^[a-zA-Z]+$/.test(w));
      setWordGame(generateWordSearch(palabras.length >= 4 ? palabras : ['english', 'school', 'family', 'time', 'work']));
    }
  };

  const responderQuiz = (i, sel) => {
    if (estado === 'hecho') return;
    setQuizSel(sel);
    setRespuestas((prev) => ({ ...prev, [i]: sel }));
    setTimeout(() => {
      setQuizIdx((idx) => idx + 1);
      setQuizSel(null);
    }, 350);
  };

  const Resultado = (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8 text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
        <Trophy className="w-8 h-8 text-green-600" />
      </div>
      <h3 className="text-xl font-bold text-slate-800">
        {t('lms.practice.result')}: {puntaje}/100
      </h3>
      <p className="text-sm text-slate-500">
        {puntaje >= 80 ? t('lms.practice.excellent') : puntaje >= 60 ? t('lms.practice.good') : t('lms.practice.keepPracticing')}
      </p>
      <div className="flex justify-center gap-2">
        <Button variant="outline" onClick={reiniciar}>
          <RefreshCw className="w-4 h-4 mr-2" /> {t('lms.practice.retry')}
        </Button>
        {!enviado && (
          <Button onClick={terminarYGuardar} disabled={enviando}>
            {enviando && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t('lms.practice.save')}
          </Button>
        )}
        {enviado && <span className="text-sm text-green-600 self-center">{t('lms.practice.saved')}</span>}
      </div>
    </div>
  );

  return (
    <div className="space-y-5 max-w-3xl">
      <Link to="/estudiante/practicas" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[#3C3B6E]">
        <ArrowLeft className="w-3.5 h-3.5" /> {t('lms.back')}
      </Link>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h2 className="text-lg font-bold text-slate-800">{data.titulo || activity.tipo}</h2>
        {data.instrucciones && <p className="text-sm text-slate-500 mt-1">{data.instrucciones}</p>}
      </div>

      {estado === 'hecho' ? (
        Resultado
      ) : (
        <>
          {/* FILL_BLANKS */}
          {activity.tipo === 'FILL_BLANKS' && (
            <div className="space-y-3">
              {(data.ejercicios ?? []).map((ex, i) => (
                <div key={i} className="bg-white rounded-lg border border-slate-100 shadow-sm p-4">
                  <p className="text-sm text-slate-700">
                    {i + 1}. {ex.sentence}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Input
                      placeholder={ex.hint ?? t('lms.practice.writeAnswer')}
                      value={respuestas[i] ?? ''}
                      onChange={(e) => setRespuestas((prev) => ({ ...prev, [i]: e.target.value }))}
                      className="max-w-xs"
                    />
                    {respuestas[i] !== undefined && String(respuestas[i]).trim() !== '' && (
                      String(respuestas[i]).trim().toLowerCase() === String(ex.answer).trim().toLowerCase() ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <X className="w-4 h-4 text-red-400" />
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* WORD_SEARCH */}
          {activity.tipo === 'WORD_SEARCH' && wordGame && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <div className="flex flex-wrap gap-2 mb-4">
                {(data.palabras ?? []).map((w) => {
                  const found = String(w).toUpperCase() === String(w).toUpperCase() && respuestas[String(w).toUpperCase()] === true;
                  return (
                    <span key={w} className={`text-xs px-2 py-1 rounded-full border ${found ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                      {found ? <Check className="w-3 h-3 inline mr-1" /> : null}{w}
                    </span>
                  );
                })}
              </div>
              <WordSearchGrid
                game={wordGame}
                onWordFound={(count, total) => {
                  setWordFound(count);
                  setRespuestas((prev) => ({ ...prev, [`w-${count}`]: true }));
                }}
              />
            </div>
          )}

          {/* QUIZ */}
          {activity.tipo === 'QUIZ' && quizIdx < totalPreguntas && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
              <p className="text-xs text-slate-400 uppercase tracking-wide">
                {t('lms.practice.question')} {quizIdx + 1} {t('lms.practice.of')} {totalPreguntas}
              </p>
              <h3 className="text-base font-semibold text-slate-800 mt-2">{data.preguntas[quizIdx].pregunta}</h3>
              <div className="mt-4 space-y-2">
                {data.preguntas[quizIdx].opciones.map((op, oi) => (
                  <button
                    key={oi}
                    onClick={() => responderQuiz(quizIdx, oi)}
                    className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                      quizSel === oi ? 'border-[#3C3B6E] bg-[#3C3B6E]/5 text-[#3C3B6E]' : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {String.fromCharCode(65 + oi)}. {op}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* LISTENING */}
          {activity.tipo === 'LISTENING' && (
            <div className="space-y-3">
              <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  {t('lms.practice.script')} (audio en Fase 3)
                </p>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{data.guion}</p>
              </div>
              {(data.preguntas ?? []).map((p, i) => (
                <div key={i} className="bg-white rounded-lg border border-slate-100 shadow-sm p-4">
                  <p className="text-sm font-medium text-slate-700">
                    {i + 1}. {p.pregunta}
                  </p>
                  <Input
                    placeholder={t('lms.practice.writeAnswer')}
                    value={respuestas[i] ?? ''}
                    onChange={(e) => setRespuestas((prev) => ({ ...prev, [i]: e.target.value }))}
                    className="mt-2 max-w-sm"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={calificar}>{t('lms.practice.check')}</Button>
          </div>
        </>
      )}
    </div>
  );
}
