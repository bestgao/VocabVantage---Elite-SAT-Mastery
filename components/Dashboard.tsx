
import React, { useState } from 'react';
import { UserProgress, MasteryLevel, AppScreen } from '../types';
import { INITIAL_WORDS, MASTERY_COLORS } from '../constants';

interface DashboardProps {
  progress: UserProgress;
  onNavigate: (screen: AppScreen, filter?: MasteryLevel) => void;
  onClaim: () => number;
}

const Dashboard: React.FC<DashboardProps> = ({ progress, onNavigate, onClaim }) => {
  const [claimedReward, setClaimedReward] = useState<number | null>(null);
  const counts = { 0: 0, 1: 0, 2: 0, 3: 0 };
  INITIAL_WORDS.forEach(w => {
    const level = progress.wordMastery[w.id] || 0;
    counts[level as MasteryLevel]++;
  });

  const total = INITIAL_WORDS.length;
  const masteryPercentage = Math.round((counts[3] / total) * 100);
  const hasClaimedToday = progress.lastCheckIn === new Date().toDateString();

  const handleClaim = () => {
    const amount = onClaim();
    if (amount > 0) setClaimedReward(amount);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {claimedReward && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in zoom-in-95">
          <div className="bg-white p-12 rounded-[3rem] text-center shadow-2xl space-y-6 max-w-sm">
            <div className="text-7xl animate-bounce">💰</div>
            <h2 className="text-3xl font-black text-slate-900">Daily Bonus!</h2>
            <p className="text-slate-500 font-medium">Your {progress.streak}-day streak earned you:</p>
            <div className="text-5xl font-black text-indigo-600">+{claimedReward} VC</div>
            <button onClick={() => setClaimedReward(null)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold">Awesome!</button>
          </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Vantage Dashboard</h1>
          <p className="text-slate-500 font-medium">Level {Math.floor(progress.xp / 1000) + 1} Elite Trainer</p>
        </div>
        <div className="flex gap-2">
          {!hasClaimedToday ? (
            <button 
              onClick={handleClaim}
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl shadow-xl shadow-indigo-100 flex flex-col items-center hover:scale-105 transition-all"
            >
              <span className="text-[10px] font-black uppercase">Claim Daily</span>
              <span className="text-lg font-bold">🎁 Reward</span>
            </button>
          ) : (
            <div className="px-6 py-2 bg-slate-100 text-slate-400 rounded-2xl flex flex-col items-center">
              <span className="text-[10px] font-black uppercase">Claimed</span>
              <span className="text-lg font-bold">✅ Check-in</span>
            </div>
          )}
          <div onClick={() => onNavigate(AppScreen.LEADERBOARD)} className="px-4 py-2 bg-slate-900 text-white rounded-2xl shadow-xl flex flex-col items-center cursor-pointer hover:scale-105 transition-transform">
            <span className="text-[10px] font-bold text-indigo-400 uppercase">Global Rank</span>
            <span className="text-lg font-bold">🏆 #{progress.xp > 0 ? 124 : '---'}</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
            Knowledge Mastery
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
                return (
                  <div key={level} className="group cursor-pointer" onClick={() => onNavigate(AppScreen.LEARN, level)}>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className={config.text}>{config.label}</span>
                      <span className="text-slate-400">{counts[level]} Words</span>
                    </div>
                    <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden border border-slate-100">
                      <div className={`${config.bg.replace('bg-', 'bg-').replace('-50', '-500')} h-full rounded-full transition-all duration-700`} style={{ width: `${(counts[level] / total) * 100}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white flex flex-col justify-between shadow-xl shadow-indigo-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 text-4xl opacity-20">🧊</div>
          <div>
            <span className="text-indigo-200 text-sm font-bold uppercase tracking-widest">Inventory</span>
            <h3 className="text-2xl font-bold mt-2 leading-tight">Streak Protection</h3>
            <div className="mt-4 flex gap-4">
              <div className="bg-white/10 p-4 rounded-2xl flex-1 text-center">
                <p className="text-2xl font-bold">{progress.inventory.streakFreezes}</p>
                <p className="text-[10px] font-black uppercase text-indigo-200">Freezes</p>
              </div>
              <div className="bg-white/10 p-4 rounded-2xl flex-1 text-center">
                <p className="text-2xl font-bold">{progress.inventory.xpBoosters}</p>
                <p className="text-[10px] font-black uppercase text-indigo-200">Boosters</p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => onNavigate(AppScreen.STORE)}
            className="mt-8 bg-white text-indigo-600 py-4 rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
          >
            Visit Credit Store
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[
          { id: AppScreen.LEARN, title: 'Learn Mode', icon: '🧠', color: 'bg-rose-50' },
          { id: AppScreen.GAMES, title: 'Games Hub', icon: '🎮', color: 'bg-indigo-50' },
          { id: AppScreen.ACHIEVEMENTS, title: 'My Medals', icon: '🎖️', color: 'bg-emerald-50' },
          { id: AppScreen.STORE, title: 'Vantage Store', icon: '🛒', color: 'bg-amber-50' },
          { id: AppScreen.AI_TUTOR, title: 'AI Expert', icon: '🤖', color: 'bg-sky-50' },
        ].map(card => (
          <button
            key={card.id}
            onClick={() => onNavigate(card.id)}
            className={`${card.color} p-6 rounded-[2rem] text-left hover:-translate-y-1 transition-all border border-transparent hover:border-slate-200 shadow-sm`}
          >
            <span className="text-3xl block mb-2">{card.icon}</span>
            <span className="font-black text-slate-900 block leading-tight">{card.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
