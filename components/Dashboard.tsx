
import React from 'react';
import { UserProgress, MasteryLevel } from '../types';
import { INITIAL_WORDS, MASTERY_COLORS } from '../constants';

interface DashboardProps {
  progress: UserProgress;
  onNavigate: (screen: any, filter?: MasteryLevel) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ progress, onNavigate }) => {
  const counts = { 0: 0, 1: 0, 2: 0, 3: 0 };
  INITIAL_WORDS.forEach(w => {
    const level = progress.wordMastery[w.id] || 0;
    counts[level as MasteryLevel]++;
  });

  const total = INITIAL_WORDS.length;
  const masteryPercentage = Math.round((counts[3] / total) * 100);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Vantage Dashboard</h1>
          <p className="text-slate-500 font-medium">Your path to an 800 Verbal score.</p>
        </div>
        <div className="flex gap-2">
          <div className="px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
            <span className="text-[10px] font-bold text-orange-500 uppercase">Streak</span>
            <span className="text-lg font-bold">🔥 {progress.streak}</span>
          </div>
          <div className="px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
            <span className="text-[10px] font-bold text-blue-500 uppercase">XP</span>
            <span className="text-lg font-bold">💎 {progress.xp}</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
            Mastery Analysis
          </h2>
          
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-50" />
                <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="10" fill="transparent" 
                  strokeDasharray={`${(masteryPercentage / 100) * 283} 283`}
                  className="text-emerald-500 transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black">{masteryPercentage}%</span>
                <span className="text-[10px] uppercase font-bold text-slate-400">Mastery</span>
              </div>
            </div>

            <div className="flex-1 w-full space-y-3">
              {(Object.keys(MASTERY_COLORS) as unknown as MasteryLevel[]).map(level => {
                const config = MASTERY_COLORS[level];
                const width = (counts[level] / total) * 100;
                return (
                  <div key={level} className="group cursor-pointer" onClick={() => onNavigate('LEARN', level)}>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className={config.text}>{config.label}</span>
                      <span className="text-slate-400">{counts[level]} Words</span>
                    </div>
                    <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden border border-slate-100">
                      <div 
                        className={`${config.bg.replace('bg-', 'bg-').replace('-50', '-500')} h-full rounded-full transition-all duration-700 group-hover:opacity-80`} 
                        style={{ width: `${width}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white flex flex-col justify-between shadow-xl shadow-indigo-100">
          <div>
            <span className="text-indigo-200 text-sm font-bold uppercase tracking-widest">Flash Practice</span>
            <h3 className="text-2xl font-bold mt-2 leading-tight">Master the Red Words Today</h3>
            <p className="mt-4 text-indigo-100 text-sm">Focus on the {counts[0]} words you haven't started yet to maximize growth.</p>
          </div>
          <button 
            onClick={() => onNavigate('LEARN', 0)}
            className="mt-8 bg-white text-indigo-600 py-4 rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Start Focus Session
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { id: 'LEARN', title: 'Learn Mode', icon: '🧠', color: 'bg-rose-50' },
          { id: 'QUIZ', title: 'SAT Quiz', icon: '📝', color: 'bg-amber-50' },
          { id: 'WORD_BANK', title: 'Word Bank', icon: '📂', color: 'bg-emerald-50' },
          { id: 'AI_TUTOR', title: 'AI Expert', icon: '🤖', color: 'bg-sky-50' },
        ].map(card => (
          <button
            key={card.id}
            onClick={() => onNavigate(card.id)}
            className={`${card.color} p-6 rounded-[2rem] text-left hover:-translate-y-1 transition-all border border-transparent hover:border-slate-200`}
          >
            <span className="text-3xl block mb-2">{card.icon}</span>
            <span className="font-black text-slate-900 block">{card.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
