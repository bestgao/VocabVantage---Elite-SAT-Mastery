import React, { useMemo } from 'react';
import { ArrowLeft, BookOpenCheck, Brain, Target } from 'lucide-react';
import { UserProgress, Word } from '../types';
import { buildErrorProfile, recommendedFocus } from '../services/errorProfile';

interface AITutorProps {
  words: Word[];
  progress: UserProgress;
  onBack: () => void;
}

const AITutor: React.FC<AITutorProps> = ({ words, progress, onBack }) => {
  const errorProfile = useMemo(() => buildErrorProfile(words, progress).slice(0, 5), [words, progress]);
  const focus = useMemo(() => recommendedFocus(words, progress), [words, progress]);
  const dueCount = Object.values(progress.wordSRS || {}).filter(srs => {
    const dueAt = Date.parse(srs.nextReviewAt);
    return Number.isFinite(dueAt) && dueAt <= Date.now();
  }).length;

  return (
    <div className="max-w-4xl mx-auto px-4 pb-24 space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-500 font-black text-xs uppercase tracking-widest"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <section className="bg-slate-950 text-white rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 shadow-2xl">
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shrink-0">
            <Brain size={28} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-indigo-300">Study Coach</p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mt-2">Your next best move</h1>
            <p className="text-slate-300 font-medium mt-4 leading-relaxed">{focus}</p>
          </div>
        </div>
      </section>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <Target className="text-indigo-600" size={26} />
          <p className="text-3xl font-black text-slate-950 mt-4">{dueCount}</p>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-1">Due reviews</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <BookOpenCheck className="text-emerald-600" size={26} />
          <p className="text-3xl font-black text-slate-950 mt-4">{progress.recommendedDailyWords || progress.dailyMasteryGoal}</p>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-1">Daily target</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <Brain className="text-rose-600" size={26} />
          <p className="text-3xl font-black text-slate-950 mt-4">{errorProfile.length}</p>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-1">Weak patterns</p>
        </div>
      </div>

      <section className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-100 shadow-sm">
        <h2 className="text-2xl font-black text-slate-950">Weakness patterns</h2>
        <div className="mt-5 space-y-3">
          {errorProfile.length === 0 ? (
            <p className="text-sm text-slate-500 font-medium">
              Complete a few quizzes and reviews to unlock more specific coaching.
            </p>
          ) : (
            errorProfile.map(item => (
              <div key={item.label} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex justify-between gap-4">
                  <p className="font-black text-slate-900">{item.label}</p>
                  <p className="font-black text-indigo-600">{Math.round(item.accuracy * 100)}%</p>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {item.attempts} attempts. Practice priority {Math.round(item.priority)}.
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default AITutor;
