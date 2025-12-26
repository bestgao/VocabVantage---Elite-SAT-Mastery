
import React from 'react';
import { UserProgress } from '../types';

interface MedalGalleryProps {
  progress: UserProgress;
  onBack: () => void;
  onClaimMilestone: (id: string, bonus: number) => void;
}

const MedalGallery: React.FC<MedalGalleryProps> = ({ progress, onBack, onClaimMilestone }) => {
  const consistencyMilestones = [
    { id: 'cons_7', title: '1 Week: Scholar', days: 7, bonus: 1000, icon: '📅', desc: 'One full week of sticking to your daily plan.' },
    { id: 'cons_14', title: '2 Weeks: Discipline', days: 14, bonus: 2500, icon: '🛡️', desc: 'Half a month of unbroken mastery focus.' },
    { id: 'cons_30', title: '1 Month: Titan', days: 30, bonus: 6000, icon: '🏆', desc: 'One month of absolute commitment.' },
    { id: 'cons_90', title: 'Quarter Year: Legend', days: 90, bonus: 25000, icon: '🌌', desc: '3 months. Your vocabulary is now in the top tier.' },
    { id: 'cons_180', title: 'Half Year: Immortal', days: 180, bonus: 65000, icon: '🌋', desc: '6 months. Cognitive dominance achieved.' },
    { id: 'cons_365', title: 'Full Year: Aether', days: 365, bonus: 180000, icon: '✨', desc: 'One full year. Your future self thanks you.' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-500 pb-24">
      <header className="text-center space-y-3">
        <h2 className="text-6xl font-black text-slate-900 tracking-tight">Milestone Vault</h2>
        <p className="text-slate-500 font-medium">Massive Credit payouts for those who stick to the protocol.</p>
      </header>

      <section className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {consistencyMilestones.map(m => {
            const isReached = progress.streak >= m.days;
            const isClaimed = progress.milestonesClaimed.includes(m.id);
            const canClaim = isReached && !isClaimed;

            return (
              <div 
                key={m.id} 
                className={`p-10 rounded-[4rem] border-2 transition-all relative overflow-hidden flex flex-col justify-between ${
                  isClaimed ? 'bg-slate-50 border-slate-200 opacity-60' : 
                  isReached ? 'bg-indigo-50 border-indigo-200 shadow-2xl ring-4 ring-indigo-500/10' : 
                  'bg-white border-slate-100 opacity-80'
                }`}
              >
                <div className="relative z-10">
                   <div className="flex justify-between items-start mb-8">
                      <div className="text-5xl">{m.icon}</div>
                      <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">{m.bonus} VC</span>
                   </div>
                   <h4 className="text-2xl font-black text-slate-900 mb-2">{m.title}</h4>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Streak Required: {m.days} Days</p>
                   <p className="text-xs text-slate-500 font-medium leading-relaxed mb-8">{m.desc}</p>
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between text-[9px] font-black uppercase">
                      <span className="text-slate-400">Current Progress</span>
                      <span className={isReached ? 'text-indigo-600' : 'text-slate-400'}>{progress.streak} / {m.days}</span>
                   </div>
                   <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                      <div className={`h-full transition-all duration-1000 ${isReached ? 'bg-indigo-500' : 'bg-slate-300'}`} style={{ width: `${Math.min((progress.streak / m.days) * 100, 100)}%` }}></div>
                   </div>

                   <button 
                     disabled={!canClaim}
                     onClick={() => onClaimMilestone(m.id, m.bonus)}
                     className={`w-full py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest transition-all ${
                       isClaimed ? 'bg-slate-200 text-slate-500 cursor-not-allowed' :
                       canClaim ? 'bg-indigo-600 text-white shadow-xl animate-pulse' :
                       'bg-slate-100 text-slate-400'
                     }`}
                   >
                     {isClaimed ? 'CLAIMED' : canClaim ? `SECURE REWARD` : 'LOCKED'}
                   </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="text-center pt-8">
        <button onClick={onBack} className="px-10 py-4 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all">Back to Dashboard</button>
      </div>
    </div>
  );
};

export default MedalGallery;
