
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';
import LessonEngine from '@/components/lesson/LessonEngine';
import { useI18n } from '@/lib/i18n/index.jsx';

const IMG_OFFICE = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><rect width="800" height="450" fill="#3C3B6E"/><text x="400" y="210" font-family="Arial" font-size="34" fill="white" text-anchor="middle">Engineering office</text><text x="400" y="260" font-family="Arial" font-size="22" fill="white" opacity="0.8" text-anchor="middle">Medellín, Colombia</text></svg>');
const IMG_CONSTRUCTION = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><rect width="800" height="450" fill="#B22234"/><text x="400" y="210" font-family="Arial" font-size="34" fill="white" text-anchor="middle">Construction site</text><text x="400" y="260" font-family="Arial" font-size="22" fill="white" opacity="0.8" text-anchor="middle">Bridge over the river</text></svg>');
const IMG_MEETING = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><rect width="800" height="450" fill="#2e2d5a"/><text x="400" y="210" font-family="Arial" font-size="34" fill="white" text-anchor="middle">Project meeting</text><text x="400" y="260" font-family="Arial" font-size="22" fill="white" opacity="0.8" text-anchor="middle">Team reviewing blueprints</text></svg>');
const IMG_BLUEPRINT = IMG_MEETING;

const VISUAL_PROMPTS = [
  'Photorealistic view of a modern engineering office in Medellín, Colombia, with engineers collaborating around monitors showing 3D bridge models and project timelines, large windows with Andes mountain views, professional atmosphere, natural lighting, wide angle',
  'Photorealistic construction site in Medellín, Colombia, with tower cranes, concrete structures being built, workers in orange safety vests and white helmets, Andes mountains in the background, clear sky, professional photography, wide shot',
  'Photorealistic project management meeting room, diverse engineering team reviewing blueprints and Gantt charts on a large table, sticky notes, coffee cups, laptops, whiteboard with project timeline, collaborative professional atmosphere, natural lighting',
];

const sampleLesson = {
  title: 'Gestión de Proyectos en Medellín',
  level: 'B1',
  key_vocabulary: ['project', 'deadline', 'blueprint', 'stakeholder', 'budget', 'milestone', 'contractor', 'timeline', 'site', 'report', 'meeting', 'schedule', 'quality', 'review', 'progress'],
  reading_text: `Juan is a senior engineer who manages construction projects in Medellín. Each morning, he arrives at his office in El Poblado and checks the project timeline on his computer. Today, his team is working on a new bridge over the Medellín River. Juan reviews the blueprints, discusses the budget with stakeholders, and schedules a meeting with the contractor. In the afternoon, he visits the construction site to inspect progress and ensure quality standards are met.`,
  listening_script: `[accent:US] Good morning, Juan. Here is your project update for today. [pause] The bridge construction in Medellín is currently on schedule. The foundation work was completed last week, which represented a major milestone. [pause] However, the next phase requires additional steel materials that will arrive next Monday. [pause] Please review the updated blueprint before your meeting with the stakeholder on Friday. The budget currently allows for a five percent margin. [pause] Thank you, and have a productive day!`,
  writing_prompt: `You are Juan. Write a short email (60-80 words) to the bridge project stakeholders summarizing today's progress. Include: the foundation completion, the materials delay, the Friday meeting, and the current budget status. Use B1-level professional English.`,
  speaking_instructions: `Practice these sentences aloud. Focus on B1 sounds: the /ʃ/ in "schedule", "stakeholder", and the /θ/ in "thursday". Use the accent you selected above.

Practice sentences:
• "The project is currently on schedule."
• "We completed the foundation last week."
• "Please review the blueprint before the meeting."
• "The budget allows for a five percent margin."`,
  activities: [
    {
      type: 'visual_storytelling',
      title: 'Visual Storytelling: Juan in Medellín',
      instructions: 'Lee la historia de Juan y observa las 3 imágenes generadas de su vida real. Luego responde la pregunta de comprensión.',
      data: {
        story: `Juan is a senior engineer who manages construction projects in Medellín. Each morning, he arrives at his office in El Poblado and checks the project timeline. Today, his team is working on a new bridge over the Medellín River. Juan reviews the blueprints, discusses the budget with stakeholders, and schedules a meeting with the contractor. In the afternoon, he visits the construction site to inspect the quality of the work.`,

        image_prompts: VISUAL_PROMPTS,
        image_urls: [IMG_OFFICE, IMG_CONSTRUCTION, IMG_MEETING],
        comprehension_question: 'What does Juan do in the afternoon?',
        options: [
          'Visits the construction site to inspect the quality',
          'Stays home and sends a few emails',
          'Meets friends at a coffee shop in El Poblado',
        ],
        answer: 'Visits the construction site to inspect the quality',
      },
    },
    {
      type: 'hangman',
      title: 'Ahorcado: Vocabulario de Ingeniería',
      instructions: 'Adivina las 5 palabras clave de la profesión de Juan, letra por letra. Tienes 6 errores por palabra.',
      data: {
        theme: 'Ingeniería de proyectos',
        words: ['BLUEPRINT', 'STAKEHOLDER', 'DEADLINE', 'MILESTONE', 'CONTRACTOR'],
      },
    },
    {
      type: 'word_search',
      title: 'Sopa de Letras: 15 Términos del Proyecto',
      instructions: 'Encuentra las 15 palabras clave del proyecto en la cuadrícula. Arrastra desde la primera hasta la última letra.',
      data: {
        words: ['project', 'deadline', 'blueprint', 'stakeholder', 'budget', 'milestone', 'contractor', 'timeline', 'site', 'report', 'meeting', 'schedule', 'quality', 'review', 'progress'],
      },
    },
    {
      type: 'fill_gaps',
      title: "Fill in the Gaps: Juan's Project Narrative",
      instructions: 'Completa los 7 espacios con la gramática correcta del nivel B1. Usa las pistas si necesitas ayuda.',
      data: {
        exercises: [
          { sentence: 'Last week, the team ___ a critical milestone in the project.', answer: 'reached', hint: 'r______ (7 letters)' },
          { sentence: 'Juan ___ blueprints every morning before the meeting.', answer: 'reviews', hint: 'r______ (7 letters)' },
          { sentence: 'The construction ___ is located near the Medellín River.', answer: 'site', hint: 's___ (4 letters)' },
          { sentence: 'Yesterday, the stakeholder ___ the budget proposal.', answer: 'approved', hint: 'a______ (8 letters)' },
          { sentence: 'Juan has ___ on this project since January.', answer: 'worked', hint: 'w_____ (6 letters)' },
          { sentence: 'The contractor ___ that the materials were high quality.', answer: 'confirmed', hint: 'c________ (9 letters)' },
          { sentence: 'Every Friday, Juan ___ a progress report to the stakeholders.', answer: 'submits', hint: 's_____ (7 letters)' },
        ],
      },
    },
    {
      type: 'reading_completing',
      title: 'Reading & Completing: Logical Conclusions',
      instructions: 'Lee cada párrafo y elige la conclusión lógica de las 3 opciones.',
      data: {
        passages: [
          {
            text: 'Juan has been managing the bridge project for three months. The team is two weeks ahead of schedule. The budget is under control and the quality tests passed.',
            options: ['The project is going well', 'The project has serious problems', 'The project was cancelled last week'],
            answer: 'The project is going well',
          },
          {
            text: 'Yesterday, the contractor reported that heavy rain damaged some materials on the construction site. Juan immediately called a meeting to assess the situation.',
            options: ['Juan will ignore the problem', 'Juan will take action to address the damage', 'The project is now completely finished'],
            answer: 'Juan will take action to address the damage',
          },
          {
            text: 'The stakeholder asked for a 20% increase in the bridge load capacity. This change requires new blueprints and additional materials.',
            options: ['The changes have no impact on the project', 'The project will need more time and money', 'The team has already completed the changes'],
            answer: 'The project will need more time and money',
          },
          {
            text: 'During the quality inspection, the engineer found that the concrete did not meet the required strength standards. The team must remove and replace it.',
            options: ['The concrete is fine and can stay', 'The team should celebrate the inspection', 'The project will be delayed due to the replacement'],
            answer: 'The project will be delayed due to the replacement',
          },
        ],
      },
    },
    {
      type: 'vocabulary_context',
      title: 'Vocabulary in Context: Match Definitions',
      instructions: 'Conecta cada palabra técnica con su definición aplicada al escenario real de Juan.',
      data: {
        pairs: [
          { word: 'blueprint', definition: 'A detailed technical drawing that Juan reviews each morning to guide the construction team' },
          { word: 'stakeholder', definition: 'A person or group who has an interest in the project — Juan reports progress to them weekly' },
          { word: 'milestone', definition: 'A significant point in the project timeline — Juan\'s team celebrated one last week' },
          { word: 'budget', definition: 'The financial plan for the project that Juan must not exceed' },
          { word: 'contractor', definition: 'The company that Juan hires to execute the physical construction work on the site' },
          { word: 'timeline', definition: 'The schedule showing when each phase of the project should be completed' },
        ],
      },
    },
    {
      type: 'transcriptor',
      title: 'The Transcriptor: Audio Dictation',
      instructions: 'Escucha el audio (usa el acento seleccionado arriba) y escribe exactamente lo que escuchas. Necesitas 60% de precisión para aprobar.',
      data: {
        script: `[accent:US] Good morning Juan. The bridge construction in Medellín is currently on schedule. The foundation work was completed last week, which represented a major milestone. However, the next phase requires additional steel materials that will arrive next Monday. Please review the updated blueprint before your meeting with the stakeholder on Friday.`,
      },
    },
    {
      type: 'image_to_word',
      title: 'Image-to-Word: Engineering Objects',
      instructions: 'Observa la imagen y esscribe el nombre del objeto en inglés. Luego escribe una oración usando esa palabra.',
      data: {
        answer: 'blueprint',
        hint: 'A technical drawing with measurements',
        image_url: IMG_BLUEPRINT,
        image_prompt: VISUAL_PROMPTS[0],
      },
    },
    {
      type: 'sentence_scramble',
      title: 'Sentence Scramble: Corporate Emails',
      instructions: 'Reordena las palabras para formar oraciones de correos corporativos que Juan enviaría en su trabajo.',
      data: {
        sentences: [
          { words: ['I', 'would', 'like', 'to', 'schedule', 'a', 'project', 'review', 'meeting', 'for', 'next', 'Tuesday'], context: 'Email to schedule a meeting' },
          { words: ['Please', 'find', 'attached', 'the', 'updated', 'blueprint', 'for', 'the', 'bridge', 'project'], context: 'Email with attachment' },
          { words: ['The', 'contractor', 'has', 'confirmed', 'that', 'the', 'materials', 'will', 'arrive', 'tomorrow'], context: 'Status update email' },
          { words: ['We', 'need', 'to', 'discuss', 'the', 'budget', 'before', 'the', 'deadline', 'next', 'week'], context: 'Urgent budget email' },
          { words: ['Thank', 'you', 'for', 'your', 'excellent', 'work', 'on', 'the', 'milestone', 'celebration'], context: 'Appreciation email' },
        ],
      },
    },
    {
      type: 'ai_roleplay',
      title: 'AI Roleplay: Your American Colleague',
      instructions: 'Chatea en inglés con Sarah, tu colega americana. Habla sobre el proyecto del puente. Envía al menos 2 mensajes y luego finaliza la conversación.',
      data: {
        scenario: 'Coffee break chat with Sarah, your American engineering colleague',
        level: 'B1',
        system_prompt: `You are Sarah, an American engineering colleague of Juan. You both work on a bridge construction project in Medellín, Colombia. You are friendly and professional. Ask Juan about the project, the budget, the contractor, the next milestone, or any challenges. Respond in 1-3 short, natural sentences. Use casual American English expressions (e.g. "Hey", "Sounds good", "Got it"). Keep the conversation flowing by asking follow-up questions.`,
        greeting: "Hey Juan! Grabbed your coffee already? I wanted to check in — how's the bridge project going these days? Any updates from the contractor?",
      },
    },
  ],
};

export default function SampleLesson() {
  const { t } = useI18n();
  const [accent, setAccent] = useState('us');
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#3C3B6E] mb-4">
        <ArrowLeft className="w-4 h-4" /> {t('fillblanks.backHome')}
      </Link>
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-4 h-4 text-[#B22234]" />
        <span className="text-xs font-semibold text-[#B22234] uppercase tracking-wide">{t('sample.badge')}</span>
      </div>
      <LessonEngine lesson={sampleLesson} accent={accent} onAccentChange={setAccent} />
    </div>
  );
}

