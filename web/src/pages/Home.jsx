import { db } from '../api/base44Client';

import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Sparkles, Grid3x3, BookOpen, Clock, Star } from 'lucide-react';
import { useI18n } from '@/lib/i18n/index.jsx';

export default function Home() {
  const { t, lang } = useI18n();
  const { profile, loading } = useOutletContext();
  const [lessons, setLessons] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !profile) navigate('/onboarding');
  }, [loading, profile, navigate]);

  useEffect(() => {
    if (profile) loadLessons();
  }, [profile]);

  const loadLessons = async () => {
    setLoadingLessons(true);
    try {
      const data = await db.entities.Lesson.filter({}, '-created_date', 20);
      setLessons(data);
    } catch {
      /* ignore */
    } finally {
      setLoadingLessons(false);
    }
  };

  const generateLesson = async () => {
    setGenerating(true);
    try {
      const result = await db.integrations.Core.InvokeLLM({
        prompt: `You are an expert English teacher on ACN Institute. Generate a COMPLETE personalized English lesson with 10 interactive activities for this student.

STUDENT PROFILE (RAG — permanent system context for all content):
- Name: ${profile.full_name}
- Age: ${profile.age || 'N/A'}
- Profession: ${profile.profession || 'N/A'}
- Location: ${profile.location || 'N/A'}
- Family: ${profile.family_composition || 'N/A'}
- Motivation: ${profile.motivation || 'N/A'}
- Learning goals: ${profile.learning_goals || 'N/A'}

ENGLISH LEVEL: ${profile.english_level} (CEFR). All grammar and vocabulary must match this level.

The lesson is about the student's real life — their profession, location, family, and daily activities. Make it personal and immersive.

Generate these metadata fields:
- title: a catchy title about the student's life/profession
- reading_text: 120-200 word narrative about the student's life
- listening_script: 120-200 word TTS script (mark pauses with [pause])
- writing_prompt: a professional writing task related to their profession
- speaking_instructions: pronunciation practice for Spanish speakers at this level
- key_vocabulary: exactly 15 key single words from the lesson
- audio_accent: "us"

Plus EXACTLY 10 activities in the "activities" array. Each activity object must have: type, title, instructions, data. The 10 activity types (IN THIS ORDER) and their data structures:

1. type="visual_storytelling": data = { story (60-100 word narrative about the student), image_prompts (array of 3 detailed photorealistic image description strings illustrating scenes from the story), comprehension_question, options (array of 3), answer }

2. type="hangman": data = { theme (short description), words (array of 5 single uppercase words related to the student's profession, 5-12 letters each) }

3. type="word_search": data = { words (array of 15 single lowercase words related to the student's profession and life) }

4. type="fill_gaps": data = { exercises (array of 7 objects, each with: sentence (string containing a single "___" blank), answer (single word), hint (first letter + total letters like "e_____r (8 letters)")) }

5. type="reading_completing": data = { passages (array of 4 objects, each with: text (2-3 sentences), options (array of 3 conclusion strings), answer (one of the options)) }

6. type="vocabulary_context": data = { pairs (array of 6 objects, each with: word, definition (applied to the student's real professional scenario)) }

7. type="transcriptor": data = { script (50-80 word text for TTS about the student's life, include [pause] markers and an [accent:US] tag at the start) }

8. type="image_to_word": data = { answer (a single English noun related to their profession), hint (short), image_prompt (detailed photorealistic visual description of this object on a desk) }

9. type="sentence_scramble": data = { sentences (array of 5 objects, each with: words (array in CORRECT order forming a corporate email sentence the student would send), context (short email context description)) }

10. type="ai_roleplay": data = { scenario (a professional chat scenario), level (the student's CEFR level "${profile.english_level}"), system_prompt (detailed instructions describing an American colleague's personality, role, and English style — 2-4 sentences), greeting (the colleague's first message to the student) }

ALL content must be personalized to the student using their profession, location, family, and motivation. Grammar and vocabulary must match ${profile.english_level} level exactly.`,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            reading_text: { type: 'string' },
            listening_script: { type: 'string' },
            writing_prompt: { type: 'string' },
            speaking_instructions: { type: 'string' },
            key_vocabulary: { type: 'array', items: { type: 'string' } },
            audio_accent: { type: 'string' },
            activities: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  title: { type: 'string' },
                  instructions: { type: 'string' },
                  data: { type: 'object', additionalProperties: true },
                },
              },
            },
          },
        },
      });

      const lesson = await db.entities.Lesson.create({
        title: result.title,
        level: profile.english_level,
        reading_text: result.reading_text,
        listening_script: result.listening_script,
        writing_prompt: result.writing_prompt,
        speaking_instructions: result.speaking_instructions,
        key_vocabulary: result.key_vocabulary,
        activities: result.activities || [],
        activities_completed: 0,
        activities_passed: 0,
        mastered: false,
        completed: false,
        audio_accent: result.audio_accent || 'us',
        student_profile_id: profile.id,
      });

      setLessons((prev) => [lesson, ...prev]);
      navigate(`/lesson/${lesson.id}`);
    } catch {
      /* error bubbles */
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#3C3B6E] rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#3C3B6E] to-[#2e2d5a] p-6 sm:p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#B22234] opacity-10 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="relative">
          <p className="text-white/70 text-sm font-medium">{t('home.welcomeBack')}</p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-0.5">{profile.full_name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#B22234]">{t('home.level')} {profile.english_level}</span>
            {profile.profession && <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/15">{profile.profession}</span>}
            {profile.location && <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/15">{profile.location}</span>}
          </div>
          {profile.motivation && <p className="text-white/70 text-sm mt-3 italic">"{profile.motivation}"</p>}
          <div className="flex flex-wrap gap-3 mt-5">
            <Button onClick={generateLesson} disabled={generating} className="bg-white text-[#3C3B6E] hover:bg-white/90 rounded-xl font-semibold">
              {generating ? (
                <><div className="w-4 h-4 border-2 border-[#3C3B6E]/30 border-t-[#3C3B6E] rounded-full animate-spin mr-2" />{t('home.generatingLesson')}</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />{t('home.generateNewLesson')}</>
              )}
            </Button>
            <Link to="/word-search">
              <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20 rounded-xl font-semibold">
                <Grid3x3 className="w-4 h-4 mr-2" />{t('home.wordSearch')}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#3C3B6E]" /> {t('home.yourLessons')}
          </h2>
          <Link to="/sample-lesson" className="text-sm font-medium text-[#B22234] hover:underline flex items-center gap-1">
            <Star className="w-3.5 h-3.5" /> {t('home.viewSample')}
          </Link>
        </div>

        {loadingLessons ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : lessons.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">{t('home.noLessonsYet')}</p>
            <p className="text-slate-400 text-xs mt-1">{t('home.eachLesson10')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lessons.map((lesson) => (
              <Link
                key={lesson.id}
                to={`/lesson/${lesson.id}`}
                className="group bg-white rounded-2xl border border-slate-100 p-5 hover:border-[#3C3B6E] hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-[#3C3B6E]/10 text-[#3C3B6E]">{lesson.level}</span>
                  {lesson.mastered ? (
                    <span className="text-xs font-medium text-green-600">{t('home.dominated')}</span>
                  ) : lesson.completed ? (
                    <span className="text-xs font-medium text-amber-600">{lesson.activities_passed || 0}/10</span>
                  ) : (
                    <span className="text-xs font-medium text-slate-400">{lesson.activities_completed || 0}/10</span>
                  )}
                </div>
                <h3 className="font-semibold text-slate-800 group-hover:text-[#3C3B6E] transition-colors line-clamp-2">{lesson.title}</h3>
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(lesson.created_date).toLocaleDateString(lang === 'en' ? 'en' : 'es', { day: 'numeric', month: 'short' })}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

