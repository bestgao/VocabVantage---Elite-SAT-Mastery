
import React, { useState } from 'react';
import { UserProgress, MasteryLevel, AppScreen, Word } from '../types';
import { INITIAL_WORDS, MASTERY_COLORS } from '../constants';

interface DashboardProps {
  progress: UserProgress;
  onNavigate: (screen: AppScreen, filter?: MasteryLevel, satLevel?: Word['satLevel']) => void;
  onDiscover: () => void;
  isDiscovering: boolean;
  onClaim: () => number;
  onUpgrade: () => void;
  onReset: () => void;
  onImportSync: (data: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ progress, onNavigate, onDiscover, isDiscovering, onClaim, onUpgrade, onReset, onImportSync }) => {
  const [claimedReward, setClaimedReward] = useState<number | null>(null);
  const [showSync, setShowSync] = useState(false);
  const [syncInput, setSyncInput] = useState('');
  
  const allWords = [...INITIAL_WORDS, ...progress.customWords];
  
  const stats = {
    total: allWords.length,
    mastered: 0,
    core: { total: 0, mastered: 0 },
    medium: { total: 0, mastered: 0 },
    advanced: { total: 0, mastered: 0 },
    highFreq: { total: 0, mastered: 0 },
    masteryDistribution: { 0: 0, 1: 0, 2: 0, 3: 0 } as Record<number, number>
  };

  allWords.forEach(w => {
    const level = progress.wordMastery[w.id] || 0;
    stats.masteryDistribution[level]++;
    const isMastered = level === 3;
    if (isMastered) stats.mastered++;
    if (w.satLevel === 'Core') { stats.core.total++; if (isMastered) stats.core.mastered++; }
    else if (w.satLevel === 'Medium') { stats.medium.total++; if (isMastered) stats.medium.mastered++; }
    else if (w.satLevel === 'Advanced') { stats.advanced.total++; if (isMastered) stats.advanced.mastered++; }
    if (w.frequencyTier === 'High') { stats.highFreq.total++; if (isMastered) stats.highFreq.mastered++; }
  });

  const getPercentage = (count: number) => stats.total > 0 ? (count / stats.total) * 100 : 0;

  const handleExport = () => {
    const exportData = btoa(JSON.stringify({ wordMastery: progress.wordMastery, credits: progress.credits, xp: progress.xp, streak: progress.streak }));
    navigator.clipboard.writeText(exportData);
    alert("Titan Sync Key copied! Paste this on your other device.");
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-24">
      {claimedReward && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white p-10 rounded-[3rem] text-center shadow-2xl space-y-6 max-w-sm animate-in zoom-in-95">
            <div className="text-7xl animate-bounce">💎</div>
            <h2 className="text-2xl font-black text-slate-900">Titan Bonus!</h2>
            <div className="text-4xl font-black text-indigo-600">+{claimedReward} VC</div>
            <button onClick={() => setClaimedReward(null)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold">Collect</button>
          </div>
        </div>
      )}

      {showSync && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4">
          <div className="bg-white w-full max-w-xl rounded-[3.5rem] p-12 shadow-2xl space-y-8 animate-in zoom-in-95">
            <div className="text-center space-y-2">
              <h3 className="text-3xl font-black text-slate-900">Vantage Sync</h3>
              <p className="text-sm text-slate-500 font-medium">Migrate your progress across PC and Mobile instantly.</p>
            </div>
            <div className="space-y-4">
              <button onClick={handleExport} className="w-full py-6 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100">Copy Export Key (This Device)</button>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Paste Sync Key here..." 
                  value={syncInput}
                  onChange={(e) => setSyncInput(e.target.value)}
                  className="w-full px-6 py-6 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-mono text-xs"
                />
              </div>
              <button onClick={() => onImportSync(syncInput)} className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Import Progress</button>
            </div>
            <button onClick={() => setShowSync(false)} className="w-full py-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Close Sync Portal</button>
          </div>
        </div>
      )}

      {/* --- ELITE STATUS OVERVIEW --- */}
      <section className="bg-slate-950 rounded-[3rem] p-8 md:p-12 text-white overflow-hidden relative border border-slate-900 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="bg-indigo-600 text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">Production Environment</span>
              <button onClick={() => setShowSync(true)} className="bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full"></span>
                Vantage Sync
              </button>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
              Lexicon <br/><span className="text-indigo-400">Superiority</span>
            </h1>
            <p className="text-slate-400 font-medium max-w-md text-sm leading-relaxed">
              GitHub repository connected. Your repository contains <span className="text-white font-black">{stats.total} words</span> ready for deployment.
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-end gap-8">
            <div className="text-right">
              <p className="text-5xl font-black text-indigo-400">{stats.total}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Repository Pool</p>
            </div>
            <button 
              onClick={() => onNavigate(AppScreen.LEARN)}
              className="bg-white text-slate-950 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-400 hover:text-white transition-all shadow-xl shadow-white/5"
            >
              Resume Training
            </button>
          </div>
        </div>
      </section>

      {/* --- MASTERY INTELLIGENCE --- */}
      <section className="space-y-6">
        <div className="flex justify-between items-end px-2">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Analytics Engine</h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.25em]">Profiling {stats.total} dataset entries</p>
          </div>
        </div>

        <div className="w-full h-10 bg-slate-100 rounded-2xl overflow-hidden flex border border-slate-200 shadow-inner group">
           <div className="h-full bg-emerald-500 transition-all duration-1000 relative group/seg" style={{ width: `${getPercentage(stats.masteryDistribution[3])}%` }}>
             <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white opacity-0 group-hover/seg:opacity-100">{Math.round(getPercentage(stats.masteryDistribution[3]))}%</span>
           </div>
           <div className="h-full bg-yellow-400 transition-all duration-1000 relative group/seg" style={{ width: `${getPercentage(stats.masteryDistribution[2])}%` }}>
             <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white opacity-0 group-hover/seg:opacity-100">{Math.round(getPercentage(stats.masteryDistribution[2]))}%</span>
           </div>
           <div className="h-full bg-orange-500 transition-all duration-1000 relative group/seg" style={{ width: `${getPercentage(stats.masteryDistribution[1])}%` }}>
             <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white opacity-0 group-hover/seg:opacity-100">{Math.round(getPercentage(stats.masteryDistribution[1]))}%</span>
           </div>
           <div className="h-full bg-rose-600 transition-all duration-1000 relative group/seg" style={{ width: `${getPercentage(stats.masteryDistribution[0])}%` }}>
             <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white opacity-0 group-hover/seg:opacity-100">{Math.round(getPercentage(stats.masteryDistribution[0]))}%</span>
           </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[3, 2, 1, 0].map(level => {
            const count = stats.masteryDistribution[level];
            const cfg = MASTERY_COLORS[level as MasteryLevel];
            return (
              <button
                key={level}
                onClick={() => onNavigate(AppScreen.LEARN, level as MasteryLevel)}
                className="bg-white p-6 rounded-[2.5rem] border border-slate-100 text-left hover:shadow-lg hover:-translate-y-1 transition-all group active:scale-95"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${cfg.text.replace('text-', 'bg-')}`}></div>
                  <span className={`text-[10px] font-black uppercase tracking-tighter ${cfg.text}`}>{cfg.label.split(':')[1].trim()}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <p className="text-4xl font-black text-slate-900 tracking-tighter">{count}</p>
                  <p className="text-xs font-black text-slate-300 uppercase tracking-widest">/</p>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{stats.total}</p>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* --- SECONDARY STATS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 flex flex-col justify-between shadow-sm hover:shadow-xl transition-shadow">
           <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-3 mb-6">
                <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                High Frequency ROI
              </h2>
              <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">Prioritizing {stats.highFreq.total} words found in top-tier SAT passages.</p>
              
              <div className="space-y-4">
                 <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                    <span className="text-slate-400">Mastery Progress</span>
                    <span className="text-emerald-600">{stats.highFreq.mastered} / {stats.highFreq.total}</span>
                 </div>
                 <div className="h-4 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                    <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${(stats.highFreq.mastered / (stats.highFreq.total || 1)) * 100}%` }}></div>
                 </div>
              </div>
           </div>
           <div className="mt-12 flex gap-4">
              <button 
                onClick={() => onNavigate(AppScreen.WORD_BANK)}
                className="flex-1 py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-colors shadow-lg shadow-slate-200"
              >
                Manage Repository
              </button>
           </div>
        </div>

        <div className="bg-indigo-50 rounded-[3rem] p-10 flex flex-col justify-between shadow-inner">
           <div>
              <h2 className="text-xl font-black text-indigo-900 flex items-center gap-3 mb-6">
                <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
                Vantage Pulse
              </h2>
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white p-6 rounded-[2.2rem] shadow-sm">
                    <p className="text-3xl font-black text-slate-900">{progress.streak}</p>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Day Streak</p>
                 </div>
                 <div className="bg-white p-6 rounded-[2.2rem] shadow-sm">
                    <p className="text-3xl font-black text-slate-900">{progress.credits}</p>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Credits (VC)</p>
                 </div>
              </div>
           </div>
           <div className="mt-8 flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {[AppScreen.GAMES, AppScreen.STORE, AppScreen.ACHIEVEMENTS].map(sc => (
                <button 
                  key={sc}
                  onClick={() => onNavigate(sc as AppScreen)}
                  className="px-6 py-4 bg-white/50 backdrop-blur-sm border border-white rounded-2xl text-[9px] font-black uppercase tracking-widest text-indigo-900 hover:bg-white transition-all shadow-sm whitespace-nowrap"
                >
                  {sc.replace('_', ' ')}
                </button>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
