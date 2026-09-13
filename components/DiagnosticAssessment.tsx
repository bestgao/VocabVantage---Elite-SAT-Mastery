import React, { useMemo, useState } from 'react';
import { Word } from '../types';
import { buildLocalContextQuestion } from '../services/contextQuestions';

export interface DiagnosticResult {
  readinessScore: number;
  estimatedKnownWords: number;
  correct: number;
  total: number;
  weakestDomain: string;
  completedAt: number;
  recommendedDailyWords: number;
}

interface DiagnosticAssessmentProps {
  words: Word[];
  onComplete: (result: DiagnosticResult) => void;
  onBack: () => void;
}

type DiagnosticQuestion = {
  word: Word;
  passage: string;
  options: string[];
  correctIndex: number;
};

const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const DiagnosticAssessment: React.FC<DiagnosticAssessmentProps> = ({ words, onComplete, onBack }) => {
  const questions = useMemo<DiagnosticQuestion[]>(() => {
    const buckets = ['Core', 'Medium', 'Advanced'].flatMap(level =>
      shuffle(words.filter(w => w.satLevel === level)).slice(0, 8)
    );
    return shuffle(buckets).slice(0, 24).map(word => {
      const q = buildLocalContextQuestion(word, words);
      return {
        word,
        passage: q.passage,
        options: q.options,
        correctIndex: q.correctIndex
      };
    });
  }, [words]);

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<{ correct: boolean; word: Word }>>([]);
  const [selected, setSelected] = useState<number | null>(null);

  if (!questions.length) {
    return <div className="p-8 text-center font-bold text-slate-500">Diagnostic unavailable.</div>;
  }

  const q = questions[index];
  const progress = Math.round(((index + 1) / questions.length) * 100);

  const choose = (optionIndex: number) => {
    if (selected !== null) return;
    setSelected(optionIndex);
  };

  const next = () => {
    if (selected === null) return;
    const newAnswers = [...answers, { correct: selected === q.correctIndex, word: q.word }];

    if (index < questions.length - 1) {
      setAnswers(newAnswers);
      setIndex(index + 1);
      setSelected(null);
      return;
    }

    const weights: Record<string, number> = { Core: 1, Medium: 1.3, Advanced: 1.6 };
    let earned = 0;
    let possible = 0;
    const domains: Record<string, { correct: number; total: number }> = {};

    newAnswers.forEach(a => {
      const weight = weights[a.word.satLevel] || 1;
      possible += weight;
      if (a.correct) earned += weight;

      const domain = a.word.academicDomain || 'General';
      domains[domain] ||= { correct: 0, total: 0 };
      domains[domain].total += 1;
      if (a.correct) domains[domain].correct += 1;
    });

    const readinessScore = Math.max(0, Math.min(100, Math.round((earned / Math.max(1, possible)) * 100)));
    const weakestDomain =
      Object.entries(domains)
        .sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total))[0]?.[0] || 'General';

    const recommendedDailyWords =
      readinessScore < 45 ? 15 :
      readinessScore < 70 ? 12 :
      readinessScore < 85 ? 10 : 8;

    onComplete({
      readinessScore,
      estimatedKnownWords: Math.round(2250 * readinessScore / 100),
      correct: newAnswers.filter(a => a.correct).length,
      total: newAnswers.length,
      weakestDomain,
      completedAt: Date.now(),
      recommendedDailyWords
    });
  };

  return (
    <div className="max-w-xl mx-auto px-4 pb-28 space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="px-4 py-2 rounded-full bg-white border border-slate-200 text-xs font-black text-slate-500">
          ← Exit
        </button>
        <div className="text-right">
          <p className="text-xs font-black text-indigo-600">SAT VOCAB DIAGNOSTIC</p>
          <p className="text-[10px] text-slate-400">{index + 1} / {questions.length}</p>
        </div>
      </div>

      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-600 transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-100 shadow-xl">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Choose the word that best fits</p>
        <p className="mt-4 text-lg md:text-xl font-bold text-slate-800 leading-relaxed">{q.passage}</p>

        <div className="space-y-3 mt-6">
          {q.options.map((option, i) => {
            const active = selected === i;
            return (
              <button
                key={`${option}-${i}`}
                onClick={() => choose(i)}
                className={`w-full p-4 rounded-2xl border-2 text-left font-bold transition-all ${
                  active ? 'border-indigo-600 bg-indigo-50 text-indigo-800' : 'border-slate-100 bg-white text-slate-700'
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={next}
        disabled={selected === null}
        className="w-full py-5 rounded-[1.5rem] bg-slate-950 text-white font-black uppercase tracking-widest disabled:opacity-40"
      >
        {index === questions.length - 1 ? 'See My Readiness Score' : 'Next'}
      </button>

      <p className="text-center text-xs text-slate-400">
        About 5–7 minutes. Your result personalizes your study plan.
      </p>
    </div>
  );
};

export default DiagnosticAssessment;
