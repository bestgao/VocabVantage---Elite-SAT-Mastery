
import React, { useState } from 'react';
import { UserProgress, MasteryLevel, AppScreen } from '../types';
import { INITIAL_WORDS, MASTERY_COLORS } from '../constants';

interface DashboardProps {
  progress: UserProgress;
  onNavigate: (screen: AppScreen, filter?: MasteryLevel) => void;
  onClaim: () => number;
  onUpgrade: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ progress, onNavigate, onClaim, onUpgrade }) => {
  const [claimedReward, setClaimedReward] = useState<number | null>(null);
  const counts = { 0: 0, 1: 0, 2: 0, 3: 0 };
  INITIAL_WORDS.forEach(w => {
    const level = progress.wordMastery[w.id] || 0;
    counts[level as MasteryLevel]++;
  });

  const total = INITIAL_WORDS.length;
  const masteredCount = counts[3];
  const masteryPercentage = Math.round((masteredCount / total) * 100);
  const hasClaimedToday = progress.lastCheckIn === new Date().toDateString();

  const handleClaim = () => {
    const amount = onClaim();
    if (amount > 0) setClaimedReward(amount);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {claimedReward && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white p-12 rounded-[3.5rem] text-center shadow-2xl space-y-6 max-w-sm animate-in zoom-in-95">
            <div className="text-7xl animate-bounce">💰</div>
            <h2 className="text-3xl font-black text-slate-900">{progress.isPremium ? 'Elite Multiplier!' : 'Daily Drop!'}</h2>
            <p className="text-slate-500 font-medium">Your {progress.streak}-day streak {progress.isPremium ? 'x2' : ''} is paying off.</p>
            <div className="text-5xl font-black text-indigo-600">+{claimedReward} VC</div>
            <button onClick={() => setClaimedReward(null)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-xl">Awesome!</button>
          </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <h1 className="text-4xl font-black text-slate-900 tracking-tight">Academic Pulse</h1>
             {progress.isPremium ? (
               <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-md uppercase tracking-widest shadow-lg shadow-indigo-100">ELITE MEMBER</span>
             ) : (
               <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black rounded-md uppercase tracking-tighter">Free Tier</span>
             )}
          </div>
          <p className="text-slate-500 font-medium">Level {Math.floor(progress.xp / 1000) + 1} • {masteredCount} Words Perfected</p>
        </div>
        <div className="flex gap-3">
          {!progress.isPremium && (
            <button 
              onClick={onUpgrade}
              className="px-6 py-3 bg-white text-slate-900 border border-slate-200 rounded-2xl font-black text-xs hover:bg-slate-50 transition-colors shadow-sm"
            >
              UPGRADE TO ELITE ✨
            </button>
          )}
          {!hasClaimedToday ? (
            <button 
              onClick={handleClaim}
              className="px-6 py-3 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-2xl shadow-xl shadow-indigo-100 flex flex-col items-center hover:scale-105 active:scale-95 transition-all"
            >
              <span className="text-[10px] font-black uppercase opacity-80">Daily Check-in</span>
              <span className="text-lg font-bold">🎁 Claim Drop</span>
            </button>
          ) : (
            <div className="px-6 py-3 bg-slate-100 text-slate-400 rounded-2xl flex flex-col items-center cursor-default">
              <span className="text-[10px] font-black uppercase">Check-in</span>
              <span className="text-lg font-bold">✅ Completed</span>
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-8xl opacity-[0.03] group-hover:rotate-12 transition-transform">📚</div>
          <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
            <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
            Word Mastery Progress
          </h2>
          
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="relative w-44 h-44">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-50" />
                <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="10" fill="transparent" 
                  strokeDasharray={`${(masteryPercentage / 100) * 283} 283`}
                  className="text-emerald-500 transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-slate-900">{masteryPercentage}%</span>
                <span className="text-[10px] uppercase font-bold text-slate-400">Mastered</span>
              </div>
            </div>

            <div className="flex-1 w-full space-y-4">
              {(Object.keys(MASTERY_COLORS) as unknown as MasteryLevel[]).map(level => {
                const config = MASTERY_COLORS[level];
                return (
                  <div key={level} className="group cursor-pointer" onClick={() => onNavigate(AppScreen.LEARN, level)}>
                    <div className="flex justify-between text-[11px] font-black mb-1.5 uppercase tracking-wide">
                      <span className={config.text}>{config.label}</span>
                      <span className="text-slate-400">{counts[level]} Words</span>
                    </div>
                    <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                      <div className={`${config.bg.replace('-50', '-500')} h-full rounded-full transition-all duration-700`} style={{ width: `${(counts[level] / total) * 100}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className={`rounded-[3rem] p-10 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden transition-all ${progress.isPremium ? 'bg-gradient-to-br from-indigo-900 to-slate-900 ring-4 ring-indigo-500/20' : 'bg-slate-900'}`}>
          <div className="absolute top-0 right-0 p-6 text-5xl opacity-10">{progress.isPremium ? '💎' : '🛡️'}</div>
          <div>
            <div className="inline-block px-3 py-1 bg-white/10 rounded-full mb-2 border border-white/5">
                <span className="text-indigo-300 text-[10px] font-black uppercase tracking-widest">Integrity: {progress.academicIntegrity}%</span>
            </div>
            <h3 className="text-3xl font-black mt-2 leading-tight">{progress.isPremium ? 'Vantage Elite' : 'Vantage Basic'}</h3>
            <p className="text-slate-400 text-sm font-medium mt-2 leading-relaxed">
              {progress.isPremium ? 'Full access to high-value payouts and verified scholarships.' : 'Upgrade to unlock real-world rewards and gift cards.'}
            </p>
            
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-3xl border border-white/5 text-center">
                <p className="text-2xl font-black">{progress.inventory.streakFreezes}</p>
                <p className="text-[10px] font-black uppercase text-indigo-400">Freezes</p>
              </div>
              <div className="bg-white/5 p-4 rounded-3xl border border-white/5 text-center">
                <p className="text-2xl font-black">{progress.inventory.xpBoosters}</p>
                <p className="text-[10px] font-black uppercase text-indigo-400">Boosters</p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => onNavigate(AppScreen.STORE)}
            className="mt-8 bg-white text-slate-900 py-4 rounded-2xl font-black text-sm hover:bg-indigo-50 active:scale-95 transition-all shadow-xl shadow-white/5"
          >
            {progress.isPremium ? 'Redeem Elite Rewards' : 'Visit Shop'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[
          { id: AppScreen.LEARN, title: 'Learn Mode', icon: '🧠', color: 'bg-rose-50 hover:bg-rose-100' },
          { id: AppScreen.GAMES, title: 'Games Hub', icon: '🎮', color: 'bg-indigo-50 hover:bg-indigo-100' },
          { id: AppScreen.ACHIEVEMENTS, title: 'Medal Gallery', icon: '🎖️', color: 'bg-emerald-50 hover:bg-emerald-100' },
          { id: AppScreen.STORE, title: 'Redeem Shop', icon: '🎁', color: 'bg-amber-50 hover:bg-amber-100' },
          { id: AppScreen.AI_TUTOR, title: 'Expert Tutor', icon: '🤖', color: 'bg-sky-50 hover:bg-sky-100' },
        ].map(card => (
          <button
            key={card.id}
            onClick={() => onNavigate(card.id)}
            className={`${card.color} p-8 rounded-[2.5rem] text-left hover:-translate-y-2 transition-all border border-transparent hover:border-slate-200 shadow-sm group`}
          >
            <span className="text-4xl block mb-4 group-hover:scale-110 transition-transform">{card.icon}</span>
            <span className="font-black text-slate-900 block leading-tight text-lg">{card.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
