import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Check, X, ArrowRight, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/index.jsx';

const QUESTIONS = [
  { question: 'Complete: "Hello, how ___ you?"', options: ['am', 'is', 'are'], answer: 'are' },
  { question: 'Complete: "She ___ a teacher."', options: ['am', 'is', 'are'], answer: 'is' },
  { question: 'Complete: "I ___ to the gym yesterday."', options: ['go', 'went', 'going'], answer: 'went' },
  { question: 'Complete: "There ___ many people at the party."', options: ['was', 'were', 'is'], answer: 'were' },
  { question: 'Complete: "If I ___ rich, I would travel the world."', options: ['am', 'was', 'were'], answer: 'were' },
  { question: 'Complete: "She has been working here ___ five years."', options: ['since', 'for', 'from'], answer: 'for' },
  { question: 'Complete: "By the time we arrived, the meeting ___ already started."', options: ['has', 'had', 'was'], answer: 'had' },
  { question: 'Complete: "I wish I ___ more time to study."', options: ['have', 'had', 'would have'], answer: 'had' },
  { question: 'Complete: "Hardly ___ the door when the phone rang."', options: ['I had opened', 'had I opened', 'I opened'], answer: 'had I opened' },
  { question: 'Complete: "The report, ___ by the committee, was published yesterday."', options: ['having been approved', 'approving', 'approved'], answer: 'having been approved' },
];

function computeLevel(correct) {
  if (correct <= 2) return 'A1';
  if (correct <= 4) return 'A2';
  if (correct <= 6) return 'B1';
  if (correct <= 8) return 'B2';
  return 'C1';
}

export default function LevelTest({ onComplete, saving }) {
  const { t } = useI18n();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [finished, setFinished] = useState(false);

  const handleSelect = (option) => {
    if (showResult) return;
    setSelected(option);
    setShowResult(true);
  };

  const handleNext = () => {
    const isCorrect = selected === QUESTIONS[current].answer;
    const newAnswers = [...answers, isCorrect];
    setAnswers(newAnswers);
    setSelected(null);
    setShowResult(false);

    if (current + 1 < QUESTIONS.length) {
      setCurrent(current + 1);
    } else {
      setFinished(true);
      const correctCount = newAnswers.filter(Boolean).length;
      setTimeout(() => onComplete(computeLevel(correctCount)), 2500);
    }
  };

  if (finished) {
    const correctCount = answers.filter(Boolean).length;
    const level = computeLevel(correctCount);
    return (
      <div className="text-center space-y-4 py-8">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#3C3B6E] to-[#B22234] flex items-center justify-center">
          <Trophy className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-[#3C3B6E]">{t('onboarding.testCompleted')}</h2>
        <p className="text-slate-500">{t('onboarding.correctOf')} {correctCount} {t('onboarding.of')} {QUESTIONS.length} {t('onboarding.questionOf').toLowerCase()}</p>
        <div className="inline-block px-6 py-3 rounded-xl bg-[#3C3B6E] text-white">
          <p className="text-sm font-medium opacity-80">{t('onboarding.yourInitialLevel')}</p>
          <p className="text-4xl font-bold">{level}</p>
        </div>
        {saving && <p className="text-sm text-slate-400 animate-pulse">{t('onboarding.settingUp')}</p>}
      </div>
    );
  }

  const q = QUESTIONS[current];
  const progress = ((current + 1) / QUESTIONS.length) * 100;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#3C3B6E]">{t('onboarding.levelTestTitle')}</h1>
        <p className="text-sm text-slate-500 mt-1">{t('onboarding.questionOf')} {current + 1} {t('onboarding.of')} {QUESTIONS.length}</p>
      </div>

      <Progress value={progress} className="h-2 bg-slate-100" />

      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <p className="text-lg font-medium text-slate-800 mb-4">{q.question}</p>
        <div className="space-y-2.5">
          {q.options.map((option) => {
            const isCorrect = option === q.answer;
            const isSelected = selected === option;
            return (
              <button
                key={option}
                onClick={() => handleSelect(option)}
                disabled={showResult}
                className={cn(
                  'w-full text-left px-4 py-3 rounded-xl border-2 font-medium transition-all',
                  !showResult && 'border-slate-200 hover:border-[#3C3B6E] hover:bg-slate-50',
                  showResult && isCorrect && 'border-green-500 bg-green-50 text-green-700',
                  showResult && isSelected && !isCorrect && 'border-red-500 bg-red-50 text-red-700',
                  showResult && !isCorrect && !isSelected && 'border-slate-100 opacity-50'
                )}
              >
                <span className="flex items-center justify-between">
                  {option}
                  {showResult && isCorrect && <Check className="w-4 h-4" />}
                  {showResult && isSelected && !isCorrect && <X className="w-4 h-4" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {showResult && (
        <Button onClick={handleNext} className="w-full bg-[#3C3B6E] hover:bg-[#2e2d5a] text-white rounded-xl py-2.5 font-semibold">
          {current + 1 < QUESTIONS.length ? t('onboarding.nextQuestion') : t('onboarding.seeResult')}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      )}
    </div>
  );
}