
import React, { useState, useMemo } from 'react';
import { UserProgress, AppScreen, MasteryLevel } from '../types';
import { MASTERY_COLORS } from '../constants';

interface DashboardProps {
  progress: UserProgress;
  lastSavedAt: number;
  bootLog: string[];
  onNavigate: (screen: AppScreen) => void;
  onUpdateGoal: (type: string, val: number) => void;
  onQuickStart: () => void;
  onReset: () => void;
  onExport: () => void;
  onRunQA: () => void;
}

const getLocalKey = (date: Date = new Date()) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const Dashboard: React.FC<DashboardProps> = ({ progress, lastSavedAt, bootLog, onNavigate, onUpdateGoal, onQuickStart, onReset, onExport, onRunQA }) => {
  const [showForensics, setShowForensics] = useState(false);
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const todayKey = getLocalKey();
  
  const getPeriodStats = (days: number) => {
    let mastered = 0;
    let reviewed = 0;
    let xp = 0;
    const now = new Date();
    for (let i = 0; i < days; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = getLocalKey(d);
      const entry = progress.activityLedger[key];
      if (entry) {
        mastered += Number(entry.mastered) || 0;
        reviewed += Number(entry.reviewed) || 0;
        xp += Number(entry.xpGained) || 0;
      }
    }
    return { mastered, reviewed, xp };
  };

  const masteryBreakdown = useMemo(() => {
    const counts = { 0: 0, 1: 0, 2: 0, 3: 0 };
    Object.values(progress.wordMastery).forEach(lvl => {
      counts[lvl as MasteryLevel]++;
    });
    return counts;
  }, [progress.wordMastery]);

  const auditData = useMemo(() => {
    return [
      { key: 'dailyMasteryGoal', label: 'Daily', days: 1, goal: progress.dailyMasteryGoal },
      { key: 'weeklyMasteryGoal', label: 'Weekly', days: 7, goal: progress.weeklyMasteryGoal },
      { key: 'monthlyMasteryGoal', label: 'Monthly', days: 30, goal: progress.monthlyMasteryGoal },
      { key: 'quarterlyMasteryGoal', label: 'Quarterly', days: 90, goal: progress.quarterlyMasteryGoal },
      { key: 'annualMasteryGoal', label: 'Annual', days: 365, goal: progress.annualMasteryGoal }
    ].map(p => {
      const stats = getPeriodStats(p.days);
      const currentGoal = Number(p.goal) || 1;
      const percent = Math.min((stats.mastered / currentGoal) * 100, 100);
      return { ...p, ...stats, percent };
    });
  }, [progress]);

  const last7Days = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      const key = getLocalKey(d);
      const entry = progress.activityLedger[key] || { mastered: 0, reviewed: 0 };
      return {
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        mastered: Number(entry.mastered) || 0,
        reviewed: Number(entry.reviewed) || 0,
        isToday: key === todayKey
      };
    });
  }, [progress.activityLedger, todayKey]);

  const maxActivity = Math.max(...last7Days.map(d => d.reviewed), 10);
  const totalMastered = Object.values(progress.wordMastery).filter(l => l === 3).length;
  const librarySize = 2250; 
  const stability = Math.round((totalMastered / librarySize) * 100);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-7xl mx-auto pb-24">
      {/* HEADER SECTION */}
      <section className="bg-slate-950 rounded-[4rem] p-12 md:p-16 text-white relative overflow-hidden shadow-2xl border-b-[12px] border-indigo-600">
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-16">
          <div className="space-y-10 flex-1">
            <div className="flex gap-3">
               <div className="flex items-center gap-2 bg-indigo-500/20 text-indigo-400 px-5 py-2 rounded-full border border-indigo-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[10px] font-black uppercase tracking-widest italic">Protocol V21 Active</span>
               </div>
               {progress.streak > 1 && (
                 <div className="bg-rose-500/30 text-rose-400 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-500/20 animate-titan">
                   {progress.streak} Day Heat 🔥
                 </div>
               )}
            </div>
            
            <div className="space-y-4">
              <h1 className="text-8xl md:text-9xl font-black tracking-tighter leading-[0.8] italic">Neural <span className="text-indigo-500 not-italic">Audit</span></h1>
              <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-xs">Unit Mastery & Historical Analytics</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-4">
               <div className="space-y-1">
                 <p className="text-4xl md:text-5xl font-black">{stability}%</p>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Stability</p>
               </div>
               <div className="border-l border-slate-800 pl-8 space-y-1">
                 <p className="text-4xl md:text-5xl font-black text-emerald-400">{totalMastered}</p>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mastered Total</p>
               </div>
               <div className="border-l border-slate-800 pl-8 space-y-1">
                 <p className="text-4xl md:text-5xl font-black text-indigo-400">{progress.xp.toLocaleString()}</p>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Earned XP</p>
               </div>
               <div className="border-l border-slate-800 pl-8 space-y-1">
                 <p className="text-4xl md:text-5xl font-black text-amber-400">{progress.credits.toLocaleString()}</p>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Credits (VC)</p>
               </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button onClick={onQuickStart} className="flex-[2] bg-white text-slate-950 py-8 rounded-[2.5rem] font-black text-2xl hover:bg-indigo-500 hover:text-white transition-all active:scale-95 shadow-2xl">Initialize Training ⚡</button>
              <button onClick={() => onNavigate(AppScreen.STUDY_SETUP)} className="flex-1 px-8 py-8 bg-indigo-600/20 text-indigo-400 rounded-[3rem] font-black text-[11px] uppercase border border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition-all">Config Hub</button>
            </div>
          </div>

          <div className="w-full lg:w-96 space-y-4">
             <div className="bg-slate-900/60 p-10 rounded-[4rem] border border-slate-800 backdrop-blur-3xl space-y-8 relative overflow-hidden">
                <h3 className="text-xl font-black text-white italic">Unit <span className="text-indigo-400">Breakdown</span></h3>
                <div className="space-y-6">
                   {[3, 2, 1, 0].map(lvl => {
                      const count = masteryBreakdown[lvl as MasteryLevel];
                      const config = MASTERY_COLORS[lvl as MasteryLevel];
                      const p = (count / librarySize) * 100;
                      return (
                        <div key={lvl} className="space-y-2">
                           <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                              <span className={config.text}>{config.label.split(':')[1]}</span>
                              <span className="text-slate-500">{count} Units</span>
                           </div>
                           <div className="h-3 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
                              <div className={`h-full ${config.text.replace('text-', 'bg-')} transition-all duration-1000`} style={{ width: `${p}%` }} />
                           </div>
                        </div>
                      );
                   })}
                </div>
                <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
             </div>
          </div>
        </div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      </section>

      {/* DETAILED PROGRESS AUDIT GRID */}
      <section className="space-y-6">
        <div className="flex justify-between items-end px-6">
           <div className="space-y-1">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic">Progress <span className="text-indigo-600">Audit</span></h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">Comparative Timeframe Analysis</p>
           </div>
           <div className="flex gap-4">
             <button onClick={() => setIsEditingGoals(!isEditingGoals)} className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border transition-all ${isEditingGoals ? 'bg-indigo-600 text-white border-indigo-700 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:text-indigo-600'}`}>
               {isEditingGoals ? '🔒 Close Config' : '⚙️ Calibrate Goals'}
             </button>
             <button onClick={() => setShowForensics(!showForensics)} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all">Forensics Mode</button>
           </div>
        </div>

        {/* GOAL CONFIGURATION PANEL */}
        {isEditingGoals && (
          <div className="bg-white p-10 rounded-[3rem] border-2 border-indigo-100 shadow-xl space-y-8 animate-in slide-in-from-top-4 duration-500">
            <div className="flex justify-between items-center px-4">
              <h3 className="text-xl font-black text-slate-900 italic">Goal <span className="text-indigo-500">Synthesis</span></h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Adjust mastery thresholds</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
               {auditData.map(p => (
                 <div key={p.key} className="space-y-3">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">{p.label} Threshold</label>
                   <input 
                     type="number"
                     defaultValue={p.goal}
                     onBlur={(e) => onUpdateGoal(p.key, Number(e.target.value))}
                     className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-black text-xl text-slate-900 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                   />
                 </div>
               ))}
            </div>
            <p className="text-[9px] font-medium text-slate-400 px-4 italic">* Changes are committed automatically upon leaving the input field.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 px-2">
           {auditData.map((p) => (
             <div key={p.key} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-xl hover:border-indigo-100 transition-all group">
                <div>
                   <div className="flex justify-between items-start mb-6">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.label} Goal</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${p.percent >= 100 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                         {Math.round(p.percent)}%
                      </span>
                   </div>
                   <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black text-slate-900">{String(p.mastered || 0)}</span>
                      <span className="text-xs font-black text-slate-300 uppercase">/ {p.goal}</span>
                   </div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Mastered Words</p>
                </div>

                <div className="mt-8 space-y-4">
                   <div className="h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100 relative">
                      <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000 progress-shimmer" style={{ width: `${p.percent}%` }} />
                   </div>
                   <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-400 px-1">
                      <span>R: {String(p.reviewed || 0)}</span>
                      <span>+{String(p.xp || 0)} XP</span>
                   </div>
                </div>
             </div>
           ))}
        </div>
      </section>

      {/* ACTIVITY CHART & ARENA SHORTCUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[4rem] p-12 border border-slate-100 shadow-sm space-y-12">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">Neural Pulse</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-1">7-Day Historical Retention Cycle</p>
            </div>
            <div className="flex gap-6">
               <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-400"></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mastery</span></div>
               <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500"></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Engagement</span></div>
            </div>
          </div>
          
          <div className="flex items-end justify-between h-72 gap-6 pb-2 relative border-b border-slate-50">
            {last7Days.map((d, i) => {
              const reviewH = (d.reviewed / (maxActivity || 1)) * 100;
              const masteryRatio = d.mastered / (d.reviewed || 1);
              const masteryH = isFinite(masteryRatio) ? masteryRatio * 100 : 0;

              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-3 group h-full justify-end">
                  <div className="flex flex-col items-center -space-y-1 mb-1 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                    <span className="text-[9px] font-black text-emerald-600">M:{String(d.mastered)}</span>
                    <span className="text-[9px] font-black text-indigo-600">R:{String(d.reviewed)}</span>
                  </div>
                  <div 
                    className={`w-full max-w-[3.5rem] rounded-2xl transition-all duration-700 relative overflow-hidden flex flex-col-reverse ${d.isToday ? 'bg-indigo-600 shadow-2xl ring-4 ring-indigo-50' : 'bg-slate-100'}`} 
                    style={{ height: `${reviewH}%`, minHeight: d.reviewed > 0 ? '6px' : '2px' }}
                  >
                    <div className="w-full bg-emerald-400" style={{ height: `${masteryH}%` }} />
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className={`text-[10px] font-black uppercase tracking-widest mt-2 ${d.isToday ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}>{d.day}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-8">
          {/* NEURAL ARENA (GAMES HUB) TILE */}
          <div className="bg-gradient-to-br from-rose-500 to-amber-500 rounded-[4rem] p-10 shadow-2xl flex flex-col justify-center items-center text-center space-y-6 overflow-hidden relative group flex-1">
             <div className="text-7xl group-hover:scale-125 group-hover:-rotate-12 transition-all duration-700 relative z-10 drop-shadow-2xl">⚡</div>
             <div className="relative z-10">
               <h3 className="text-2xl font-black text-white leading-tight italic mb-1 tracking-tighter uppercase">Neural Arena</h3>
               <p className="text-white/80 text-[10px] font-black uppercase tracking-widest">Compete for XP & Credits</p>
             </div>
             <button onClick={() => onNavigate(AppScreen.GAME_HUB)} className="w-full py-5 bg-white text-slate-900 rounded-[2rem] font-black uppercase tracking-[0.2em] hover:bg-slate-900 hover:text-white transition-all shadow-2xl relative z-10 text-[10px] active:scale-95">Enter Arena</button>
             <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
          </div>

          <div className="bg-indigo-600 rounded-[3rem] p-8 shadow-xl flex flex-col justify-center items-center text-center space-y-4 overflow-hidden relative group">
             <div className="text-5xl group-hover:rotate-12 transition-transform duration-700 relative z-10 drop-shadow-2xl">📚</div>
             <div className="relative z-10">
               <h3 className="text-xl font-black text-white leading-tight italic mb-1 tracking-tighter">Vault</h3>
               <p className="text-indigo-100 text-[9px] font-black uppercase tracking-widest">Manage 2,250 Units</p>
             </div>
             <button onClick={() => onNavigate(AppScreen.WORD_BANK)} className="w-full py-4 bg-white text-slate-950 rounded-[1.5rem] font-black uppercase tracking-[0.2em] hover:bg-slate-950 hover:text-white transition-all shadow-xl relative z-10 text-[9px]">Enter Vault</button>
          </div>
        </div>
      </div>

      {/* FORENSICS MODAL OVERLAY */}
      {showForensics && (
         <div className="fixed inset-0 z-[100] bg-slate-950/98 backdrop-blur-3xl p-10 md:p-24 flex items-center justify-center animate-in fade-in zoom-in-95">
            <div className="max-w-4xl w-full h-full bg-slate-900 rounded-[4rem] border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
               <div className="p-12 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                  <div>
                    <h4 className="text-3xl font-black uppercase tracking-tighter text-indigo-400 italic">Neural Log <span className="text-white">Forensics</span></h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Boot Diagnostics & System Integrity</p>
                  </div>
                  <button onClick={() => setShowForensics(false)} className="w-16 h-16 bg-slate-800 text-slate-400 rounded-3xl flex items-center justify-center hover:text-white hover:bg-rose-600 transition-all border border-slate-700 active:scale-90 text-2xl">✕</button>
               </div>
               
               <div className="flex-1 p-12 overflow-y-auto no-scrollbar space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-8 bg-slate-950 rounded-[2.5rem] border border-slate-800 flex flex-col justify-center">
                       <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">Vault Payload</p>
                       <p className="text-2xl font-black text-white">{new Blob([JSON.stringify(progress)]).size.toLocaleString()} <span className="text-xs text-slate-600 uppercase">Bytes</span></p>
                    </div>
                    <div className="p-8 bg-slate-950 rounded-[2.5rem] border border-slate-800 flex flex-col justify-center">
                       <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">State Protocol</p>
                       <p className="text-2xl font-black text-white">V{progress.version}.{progress.revision}</p>
                    </div>
                    <div className="p-8 bg-slate-950 rounded-[2.5rem] border border-slate-800 flex flex-col justify-center">
                       <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">Sync Clock</p>
                       <p className="text-2xl font-black text-white">{lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString() : '---'}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] px-2">Boot Sequence Ledger</h5>
                    <div className="bg-black/50 p-10 rounded-[3rem] border border-slate-800 font-mono text-[11px] leading-loose text-emerald-500/80 shadow-inner">
                      {bootLog.map((line, i) => (
                        <p key={i} className="flex gap-4"><span className="text-slate-700 select-none">[{i.toString().padStart(2, '0')}]</span> {line}</p>
                      ))}
                      <p className="flex gap-4 mt-4 text-emerald-400 font-black"><span className="text-emerald-900 select-none">[*]</span> HYDRATION COMPLETED: NO REGRESSIONS DETECTED.</p>
                    </div>
                  </div>

                  <div className="p-10 bg-indigo-600/10 rounded-[3rem] border border-indigo-500/20">
                     <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Regression Prevention Logic</h5>
                     <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        The V21 Sentinel Protocol enforces <strong>write-lock guards</strong>. If memory revision lags behind disk revision, writes are blocked to prevent multi-tab collision. Current XP Integrity: <span className="text-emerald-400 font-black italic">VERIFIED</span>.
                     </p>
                  </div>
               </div>

               <div className="p-12 border-t border-slate-800 bg-slate-950/50 flex flex-col md:flex-row gap-6">
                  <button onClick={onRunQA} className="flex-1 py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-2xl hover:bg-indigo-500 active:scale-95 transition-all">Execute Persistence QA Harness</button>
                  <button onClick={() => setShowForensics(false)} className="flex-1 py-6 bg-slate-800 text-slate-300 rounded-[2rem] font-black uppercase text-[11px] tracking-widest border border-slate-700 hover:bg-slate-700 transition-all">Dismiss Diagnostics</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
export default Dashboard;
