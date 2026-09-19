import React from 'react';
import { ArrowRight, BarChart3, BookOpenCheck, Target } from 'lucide-react';

interface OnboardingProps {
  onStartDiagnostic: () => void;
  onSkip: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onStartDiagnostic, onSkip }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 pb-24">
      <section className="min-h-[72vh] flex flex-col justify-center gap-8">
        <div className="space-y-5 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-black uppercase tracking-widest">
            VocabVantage 3.0
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-950 leading-[0.92]">
            Build SAT vocabulary that actually sticks.
          </h1>
          <p className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed max-w-2xl">
            Start with a short diagnostic, get a daily plan, then review words right before you are likely to forget them.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: Target, title: 'Personal plan', body: 'Your score and weak domains shape the first study path.' },
            { icon: BookOpenCheck, title: 'Active recall', body: 'Flashcards, SAT context, and typed recall all improve mastery.' },
            { icon: BarChart3, title: 'Progress proof', body: 'Track weak words, due reviews, goals, and mastery growth.' }
          ].map(item => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                <Icon className="text-indigo-600" size={28} />
                <h2 className="text-xl font-black text-slate-950 mt-5">{item.title}</h2>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">{item.body}</p>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onStartDiagnostic}
            className="inline-flex items-center justify-center gap-3 px-7 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-indigo-700 transition-colors"
          >
            Take Diagnostic <ArrowRight size={18} />
          </button>
          <button
            onClick={onSkip}
            className="px-7 py-5 bg-white text-slate-600 rounded-2xl border border-slate-200 font-black uppercase tracking-widest text-xs hover:text-slate-950 transition-colors"
          >
            Start Without Test
          </button>
        </div>
      </section>
    </div>
  );
};

export default Onboarding;
