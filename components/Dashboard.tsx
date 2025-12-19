
import React, { useState } from 'react';
import { UserProgress, MasteryLevel, AppScreen } from '../types';
import { INITIAL_WORDS, MASTERY_COLORS } from '../constants';

interface DashboardProps {
  progress: UserProgress;
  onNavigate: (screen: AppScreen, filter?: MasteryLevel) => void;
  onDiscover: () => void;
  isDiscovering: boolean;
  onClaim: () => number;
  onUpgrade: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ progress, onNavigate, onDiscover, isDiscovering, onClaim, onUpgrade }) => {
  const [claimedReward, setClaimedReward] = useState<number | null>(null);
  
  // Counts for each level
  const counts = { 0: 0, 1: 0, 2: 0, 3: 0 };
  const allWordIds = [...INITIAL_WORDS.map(w => w.id), ...progress.customWords.map(w => w.id)];
  allWordIds.forEach(id => {
    const level = progress.wordMastery[id] || 0;
    counts[level as MasteryLevel]++;
  });

  const totalWords = allWordIds.length;
  const masteredCount = counts[3];
  const masteryPercentage = totalWords > 0 ? Math.round((masteredCount / totalWords) * 100) : 0;
  const hasClaimedToday = progress.lastCheckIn === new Date().toDateString();

  // History for progress chart
  const getLast7Days = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  const historyDates = getLast7Days();
  const historyValues = historyDates.map(date => progress.masteryHistory[date] || 0);
  const maxHistory = Math.max(...historyValues, 1);

  const handleClaim = () => {
    const amount = onClaim();
    if (amount > 0) setClaimedReward(amount);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-24 md:pb-12">
      {claimedReward && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white p-10 rounded-[3rem] text-center shadow-2xl space-y-6 max-w-sm animate-in zoom-in-95">
            <div className="text-7xl animate-bounce">💰</div>
            <h2 className="text-2xl font-black text-slate-900">Check-in Bonus!</h2>
            <div className="text-4xl font-black text-indigo-600">+{claimedReward} VC</div>
            <button onClick={() => setClaimedReward(null)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-xl">Collect</button>
          </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Academic Pulse</h1>
          <p className="text-slate-500 font-medium text-sm">Mastering {totalWords} words • Target: 2,000ish Words</p>
        </div>
        <div className="flex gap-2">
           <button 
              onClick={onDiscover}
              disabled={isDiscovering}
              className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-900 rounded-2xl shadow-sm font-black text-[10px] uppercase tracking-widest hover:border-indigo-500 transition-all flex items-center gap-3 disabled:opacity-50"
            >
              {isDiscovering ? (
                <><div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div> Discovering...</>
              ) : (
                <>✨ Discover 50 New Words</>
              )}
            </button>
          {!hasClaimedToday ? (
            <button 
              onClick={handleClaim}
              className="px-8 py-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100 font-bold hover:scale-105 active:scale-95 transition-all"
            >
              🎁 Daily Claim
            </button>
          ) : (
            <div className="px-8 py-3 bg-slate-100 text-slate-400 rounded-2xl font-bold">✅ Claimed</div>
          )}
        </div>
      </header>

      {/* Analytics & Progress Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100">
           <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                Mastery Conversion Rate
              </h2>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Growth Trend</span>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-end">
              <div className="space-y-4">
                <div className="flex items-end justify-between h-32 gap-2">
                  {historyValues.map((val, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center group">
                      <div 
                        className={`w-full rounded-t-lg transition-all duration-1000 ${i === 6 ? 'bg-emerald-500' : 'bg-slate-100 group-hover:bg-slate-200'}`}
                        style={{ height: `${(val / maxHistory) * 100}%` }}
                      >
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[8px] font-bold p-1 rounded -top-6 relative text-center">
                          {val}
                        </div>
                      </div>
                      <span className="text-[8px] font-black text-slate-300 mt-2 uppercase">{historyDates[i].split('-')[2]}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 font-bold text-center uppercase tracking-[0.2em]">Daily Mastered (Green) Count</p>
              </div>

              <div className="space-y-4">
                 {(Object.keys(MASTERY_COLORS) as unknown as MasteryLevel[]).map(lvl => {
                   const config = MASTERY_COLORS[lvl];
                   return (
                     <div key={lvl} className="flex items-center gap-4 group cursor-pointer" onClick={() => onNavigate(AppScreen.LEARN, lvl)}>
                        <div className={`w-3 h-3 rounded-full ${config.bg.replace('-50', '-500')} transition-transform group-hover:scale-150`}></div>
                        <div className="flex-1">
                           <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                              <span className="text-slate-400">{config.label.split(':')[1]}</span>
                              <span className={config.text}>{counts[lvl]}</span>
                           </div>
                           <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                              <div className={`${config.bg.replace('-50', '-500')} h-full opacity-30 transition-all duration-1000`} style={{ width: `${(counts[lvl] / totalWords) * 100}%` }}></div>
                           </div>
                        </div>
                     </div>
                   )
                 })}
              </div>
           </div>
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-6 text-6xl opacity-10">📈</div>
           <div>
              <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-1">Efficiency Ranking</p>
              <h3 className="text-3xl font-black">Top 12%</h3>
              <p className="text-slate-400 text-sm mt-3 leading-relaxed font-medium">You are mastering vocabulary faster than 88% of standard SAT prep users.</p>
              
              <div className="mt-8 flex gap-4">
                 <div className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/5 text-center">
                    <p className="text-2xl font-black">{progress.streak}</p>
                    <p className="text-[9px] uppercase font-bold text-indigo-300">Day Streak</p>
                 </div>
                 <div className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/5 text-center">
                    <p className="text-2xl font-black">{masteryPercentage}%</p>
                    <p className="text-[9px] uppercase font-bold text-emerald-300">Total Progress</p>
                 </div>
              </div>
           </div>
           <button onClick={() => onNavigate(AppScreen.LEARN)} className="mt-8 w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">Quick Start Session</button>
        </div>
      </div>

      {/* Learn by Color Section */}
      <section className="space-y-6">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 px-2">
          <span className="w-2 h-8 bg-indigo-600 rounded-full"></span>
          Direct Review by Color
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(Object.keys(MASTERY_COLORS) as unknown as MasteryLevel[]).map(lvl => {
            const config = MASTERY_COLORS[lvl];
            const hasWords = counts[lvl] > 0;
            return (
              <button
                key={lvl}
                disabled={!hasWords}
                onClick={() => onNavigate(AppScreen.LEARN, lvl)}
                className={`p-6 rounded-[2rem] text-left border-2 transition-all group ${hasWords ? config.border + ' bg-white hover:shadow-xl hover:-translate-y-1' : 'bg-slate-50 border-slate-100 opacity-50 grayscale'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4 ${config.bg} ${config.text}`}>
                  {lvl === 0 ? '🔴' : lvl === 1 ? '🟠' : lvl === 2 ? '🟡' : '🟢'}
                </div>
                <h4 className={`font-black text-sm uppercase tracking-tight ${config.text}`}>{config.label.split(':')[1]}</h4>
                <p className="text-slate-400 text-[10px] font-bold mt-1 uppercase tracking-widest">{counts[lvl]} Words</p>
              </button>
            )
          })}
        </div>
      </section>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[
          { id: AppScreen.GAMES, title: 'Games', icon: '🎮', color: 'bg-indigo-50' },
          { id: AppScreen.WORD_BANK, title: 'Repository', icon: '📂', color: 'bg-slate-100' },
          { id: AppScreen.AI_TUTOR, title: 'AI Tutor', icon: '🤖', color: 'bg-sky-50' },
          { id: AppScreen.LEADERBOARD, title: 'Rankings', icon: '🏆', color: 'bg-amber-50' },
          { id: AppScreen.STORE, title: 'Redeem', icon: '🎁', color: 'bg-rose-50' },
        ].map(card => (
          <button
            key={card.id}
            onClick={() => onNavigate(card.id as AppScreen)}
            className={`${card.color} p-6 rounded-[2rem] text-left transition-all hover:scale-105 active:scale-95 shadow-sm`}
          >
            <span className="text-3xl block mb-3">{card.icon}</span>
            <span className="font-black text-slate-900 block text-sm uppercase tracking-tighter">{card.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
