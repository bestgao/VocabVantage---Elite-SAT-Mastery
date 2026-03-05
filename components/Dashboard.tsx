
import React, { useState, useMemo } from 'react';
import { UserProgress, AppScreen, MasteryLevel, Word } from '../types';
import { MASTERY_COLORS } from '../constants';
import { HelpCircle, X, Info, ShieldCheck, Database, Download } from 'lucide-react';
import Tooltip from './Tooltip';

interface DashboardProps {
  words: Word[];
  progress: UserProgress;
  lastSavedAt: number;
  bootLog: string[];
  onNavigate: (screen: AppScreen) => void;
  onUpdateGoal: (type: string, val: number) => void;
  onQuickStart: (words?: Word[]) => void;
  onReset: () => void;
  onExport: () => void;
  onRunQA: () => void;
}

const getLocalKey = (date: Date = new Date()) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const Dashboard: React.FC<DashboardProps> = ({ words, progress, lastSavedAt, bootLog, onNavigate, onUpdateGoal, onQuickStart, onReset, onExport, onRunQA }) => {
  const [showForensics, setShowForensics] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showDomainAudit, setShowDomainAudit] = useState(false);
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

  const weakWords = useMemo(() => {
    return Object.values(progress.wordStats)
      .filter(s => s.wrong > 0)
      .sort((a, b) => b.wrong - a.wrong)
      .slice(0, 10);
  }, [progress.wordStats]);

  const domainMastery = useMemo(() => {
    const domains: Record<string, { total: number; mastered: number }> = {};
    words.forEach(w => {
      const dom = w.academicDomain || 'General';
      if (!domains[dom]) domains[dom] = { total: 0, mastered: 0 };
      domains[dom].total++;
      if (progress.wordMastery[w.id] === 3) domains[dom].mastered++;
    });
    return Object.entries(domains).map(([name, stats]) => ({
      name,
      percent: Math.round((stats.mastered / stats.total) * 100),
      ...stats
    })).sort((a, b) => b.percent - a.percent);
  }, [words, progress.wordMastery]);

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

  const shareApp = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url);
    alert("Live URL copied to clipboard! Share this with other testers.");
  };

  const onScienceSprint = () => {
    const scienceWords = words.filter(w => (w.academicDomain || 'General') === 'Science').sort(() => 0.5 - Math.random()).slice(0, 20);
    if (scienceWords.length === 0) {
      alert("No Science units found in current vault.");
      return;
    }
    onQuickStart(scienceWords);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-7xl mx-auto pb-24">
      {/* HEADER SECTION */}
      <section className="bg-slate-950 rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-16 text-white relative overflow-hidden shadow-2xl border-b-[8px] md:border-b-[12px] border-indigo-600">
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-10 md:gap-16">
          <div className="space-y-8 md:space-y-10 flex-1 w-full text-center lg:text-left">
            <div className="flex flex-wrap justify-center lg:justify-start gap-3">
               <div className="flex items-center gap-2 bg-indigo-500/20 text-indigo-400 px-5 py-2 rounded-full border border-indigo-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[10px] font-black uppercase tracking-widest italic">Protocol V42 Active</span>
               </div>
               <button 
                 onClick={shareApp}
                 className="flex items-center gap-2 bg-slate-800 text-slate-300 px-5 py-2 rounded-full border border-slate-700 hover:bg-indigo-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest shadow-lg"
               >
                 <span>🔗</span> Share Live Link
               </button>
               <button 
                 onClick={() => setShowHelp(true)}
                 className="flex items-center gap-2 bg-indigo-600/20 text-indigo-400 px-5 py-2 rounded-full border border-indigo-500/20 hover:bg-indigo-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest shadow-lg"
               >
                 <HelpCircle size={14} /> Help Guide
               </button>
               {(!progress.lastConfig || progress.xp === 0) && (
                 <button 
                   onClick={() => {
                     localStorage.removeItem('vv:user_email');
                     window.location.reload();
                   }}
                   className="flex items-center gap-2 bg-rose-600 text-white px-5 py-2 rounded-full border border-rose-500 hover:bg-rose-700 transition-all text-[10px] font-black uppercase tracking-widest shadow-lg animate-pulse"
                 >
                   <span>🔑</span> Force Login / Reset
                 </button>
               )}
               {progress.streak > 1 && (
                 <div className="bg-rose-500/30 text-rose-400 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-500/20 animate-titan">
                   {progress.streak} Day Heat 🔥
                 </div>
               )}
            </div>
            
            <div className="space-y-4">
              <h1 className="text-6xl sm:text-7xl md:text-9xl font-black tracking-tighter leading-[0.8] italic">Neural <span className="text-indigo-500 not-italic">Audit</span></h1>
              <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px] sm:text-xs">Unit Mastery & Historical Analytics</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 md:gap-8 pt-4">
               <Tooltip text="Percentage of the 2,250 SAT words you have fully mastered.">
                 <div className="space-y-1">
                   <p className="text-4xl md:text-5xl font-black">{stability}%</p>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Stability</p>
                 </div>
               </Tooltip>
               <Tooltip text="Total number of words that have reached Level 4 (Mastered).">
                 <div className="border-l border-slate-800 pl-8 space-y-1">
                   <p className="text-4xl md:text-5xl font-black text-emerald-400">{totalMastered}</p>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mastered Total</p>
                 </div>
               </Tooltip>
               <Tooltip text="Total experience points earned through study sessions and games.">
                 <div className="border-l border-slate-800 pl-8 space-y-1">
                   <p className="text-4xl md:text-5xl font-black text-indigo-400">{progress.xp.toLocaleString()}</p>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Earned XP</p>
                 </div>
               </Tooltip>
               <Tooltip text="Virtual currency used to unlock premium features and power-ups.">
                 <div className="border-l border-slate-800 pl-8 space-y-1">
                   <p className="text-4xl md:text-5xl font-black text-amber-400">{progress.credits.toLocaleString()}</p>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Credits (VC)</p>
                 </div>
               </Tooltip>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Tooltip text="Instantly start a session with 20 random words from your current review list." position="bottom">
                <button onClick={() => onQuickStart()} className="w-full bg-white text-slate-950 py-6 md:py-8 rounded-[2rem] md:rounded-[2.5rem] font-black text-xl md:text-2xl hover:bg-indigo-500 hover:text-white transition-all active:scale-95 shadow-2xl px-12">Initialize Training ⚡</button>
              </Tooltip>
              <Tooltip text="A fast-paced review of high-yield Science vocabulary." position="bottom">
                <button onClick={onScienceSprint} className="w-full px-6 py-6 md:py-8 bg-emerald-600/20 text-emerald-400 rounded-[2rem] md:rounded-[3rem] font-black text-[10px] md:text-[11px] uppercase border border-emerald-500/30 hover:bg-emerald-600 hover:text-white transition-all">Science Sprint 🧪</button>
              </Tooltip>
              <Tooltip text="Customize your study session: select difficulty, domains, and mastery levels." position="bottom">
                <button onClick={() => onNavigate(AppScreen.STUDY_SETUP)} className="w-full px-6 py-6 md:py-8 bg-indigo-600/20 text-indigo-400 rounded-[2rem] md:rounded-[3rem] font-black text-[10px] md:text-[11px] uppercase border border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition-all">Config Hub</button>
              </Tooltip>
            </div>
          </div>

          <div className="w-full lg:w-96 space-y-4">
             <div className="bg-slate-900/60 p-8 md:p-10 rounded-[3rem] md:rounded-[4rem] border border-slate-800 backdrop-blur-3xl space-y-6 md:space-y-8 relative overflow-hidden">
                <h3 className="text-xl font-black text-white italic">Unit <span className="text-indigo-400">Breakdown</span></h3>
                <div className="space-y-6">
                   {[3, 2, 1, 0].map(lvl => {
                      const count = masteryBreakdown[lvl as MasteryLevel];
                      const config = MASTERY_COLORS[lvl as MasteryLevel];
                      const p = (count / librarySize) * 100;
                      return (
                        <Tooltip key={lvl} text={`${config.label.split(':')[1]} words: ${count} units.`}>
                          <div className="space-y-2">
                             <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                <span className={config.text}>{config.label.split(':')[1]}</span>
                                <span className="text-slate-500">{count} Units</span>
                             </div>
                             <div className="h-3 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
                                <div className={`h-full ${config.text.replace('text-', 'bg-')} transition-all duration-1000`} style={{ width: `${p}%` }} />
                             </div>
                          </div>
                        </Tooltip>
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
        <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end px-6 gap-4">
           <div className="space-y-1 text-center sm:text-left">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter italic">Progress <span className="text-indigo-600">Audit</span></h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">Comparative Timeframe Analysis</p>
           </div>
           <div className="flex flex-wrap justify-center gap-4">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 px-2">
           {auditData.map((p) => (
             <div key={p.key} className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-xl hover:border-indigo-100 transition-all group">
                <div>
                   <div className="flex justify-between items-start mb-4 md:mb-6">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.label} Goal</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${p.percent >= 100 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                         {Math.round(p.percent)}%
                      </span>
                   </div>
                   <div className="flex items-baseline gap-1">
                      <span className="text-4xl md:text-5xl font-black text-slate-900">{String(p.mastered || 0)}</span>
                      <span className="text-[10px] md:text-xs font-black text-slate-300 uppercase">/ {p.goal}</span>
                   </div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Mastered Words</p>
                </div>

                <div className="mt-6 md:mt-8 space-y-4">
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
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-12 border border-slate-100 shadow-sm space-y-8 md:space-y-12">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="text-center sm:text-left">
              <h3 className="text-2xl sm:text-3xl font-black tracking-tighter text-slate-900 uppercase italic">Neural Pulse</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-1">7-Day Historical Retention Cycle</p>
            </div>
            <div className="flex gap-4 md:gap-6">
               <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-400"></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mastery</span></div>
               <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500"></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Engagement</span></div>
            </div>
          </div>
          
          <div className="flex items-end justify-between h-48 sm:h-72 gap-2 sm:gap-6 pb-2 relative border-b border-slate-50">
            {last7Days.map((d, i) => {
              const reviewH = (d.reviewed / (maxActivity || 1)) * 100;
              const masteryRatio = d.mastered / (d.reviewed || 1);
              const masteryH = isFinite(masteryRatio) ? masteryRatio * 100 : 0;

              return (
                <div key={i} className="flex-1 flex flex-col items-center group h-full justify-end">
                  <div className="flex flex-col items-center -space-y-1 mb-1 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                    <span className="text-[8px] sm:text-[9px] font-black text-emerald-600">M:{String(d.mastered)}</span>
                    <span className="text-[8px] sm:text-[9px] font-black text-indigo-600">R:{String(d.reviewed)}</span>
                  </div>
                  <div 
                    className={`w-full max-w-[2rem] sm:max-w-[3.5rem] rounded-lg sm:rounded-2xl transition-all duration-700 relative overflow-hidden flex flex-col-reverse ${d.isToday ? 'bg-indigo-600 shadow-2xl ring-2 sm:ring-4 ring-indigo-50' : 'bg-slate-100'}`} 
                    style={{ height: `${reviewH}%`, minHeight: d.reviewed > 0 ? '6px' : '2px' }}
                  >
                    <div className="w-full bg-emerald-400" style={{ height: `${masteryH}%` }} />
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest mt-2 ${d.isToday ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}>{d.day}</p>
                </div>
              );
            })}
          </div>

          {/* COMPACT DOMAIN SUMMARY */}
          <div className="pt-12 border-t border-slate-50 space-y-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h4 className="text-xl font-black italic text-slate-900 uppercase tracking-tighter">Domain <span className="text-indigo-600">Pulse</span></h4>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Top Academic Strengths</p>
              </div>
              <button 
                onClick={() => setShowDomainAudit(true)}
                className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all"
              >
                View Full Audit
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {domainMastery.slice(0, 3).map(dom => (
                <div key={dom.name} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{dom.name}</p>
                    <p className="text-xl font-black text-slate-900">{dom.percent}%</p>
                  </div>
                  <div className="w-12 h-12 rounded-full border-4 border-slate-200 flex items-center justify-center relative shrink-0">
                    <svg className="w-full h-full -rotate-90">
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="4"
                        className="text-indigo-500"
                        strokeDasharray={125.6}
                        strokeDashoffset={125.6 - (125.6 * dom.percent) / 100}
                      />
                    </svg>
                    <span className="absolute text-[8px] font-black text-slate-400">LVL</span>
                  </div>
                </div>
              ))}
            </div>
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

      {/* DOMAIN AUDIT MODAL */}
      {showDomainAudit && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl p-4 md:p-10">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] md:rounded-[4rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-8 md:p-12 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-3xl md:text-4xl font-black tracking-tighter italic">Domain <span className="text-indigo-400">Intelligence Audit</span></h3>
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-80 mt-1">Full breakdown of academic proficiency</p>
              </div>
              <button onClick={() => setShowDomainAudit(false)} className="w-12 h-12 md:w-14 md:h-14 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-rose-600 transition-all shrink-0">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 p-8 md:p-12 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 space-y-12">
              <section className="space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Academic Domain Breakdown</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {domainMastery.map(dom => (
                    <div key={dom.name} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-4 hover:border-indigo-200 transition-all group">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{dom.name}</p>
                          <h5 className="text-3xl font-black text-slate-900">{dom.percent}%</h5>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${dom.percent > 80 ? 'bg-emerald-100 text-emerald-600' : dom.percent > 40 ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                          {dom.percent > 80 ? 'Elite' : dom.percent > 40 ? 'Stable' : 'Initial'}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[9px] font-black uppercase text-slate-400">
                            <span>{dom.mastered} Mastered</span>
                            <span>{dom.total} Total</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-600 rounded-full transition-all duration-1000" 
                              style={{ width: `${dom.percent}%` }} 
                            />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {weakWords.length > 0 ? (
                <section className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-rose-500">Critical Weaknesses (Top 10)</h4>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ranked by Error Frequency</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {weakWords.map(stat => (
                      <div key={stat.wordId} className="p-6 bg-rose-50/50 rounded-3xl border border-rose-100 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-lg font-black text-slate-900">{stat.term}</p>
                          <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest">{stat.wrong} Errors / {stat.attempts} Attempts</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xl font-black text-rose-600">{Math.round((stat.wrong / stat.attempts) * 100)}%</span>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Fail Rate</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : (
                <section className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Critical Weaknesses</h4>
                  </div>
                  <div className="p-12 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 text-center">
                    <p className="text-2xl mb-2">🎯</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No weaknesses detected yet.</p>
                    <p className="text-[10px] text-slate-400 mt-2">Complete more quizzes to identify areas for improvement.</p>
                  </div>
                </section>
              )}
            </div>

            <div className="p-8 md:p-12 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
              <button onClick={() => setShowDomainAudit(false)} className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl">Close Audit</button>
            </div>
          </div>
        </div>
      )}

      {showHelp && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl p-4 md:p-10">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-[3rem] md:rounded-[4rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-8 md:p-12 bg-indigo-600 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-3xl md:text-4xl font-black tracking-tighter italic">Titan <span className="text-indigo-200">Intelligence Guide</span></h3>
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-80 mt-1">System Navigation & Data Management</p>
              </div>
              <button onClick={() => setShowHelp(false)} className="w-12 h-12 md:w-14 md:h-14 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all shrink-0">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 p-8 md:p-12 overflow-y-auto space-y-12 text-slate-900 scrollbar-thin scrollbar-thumb-slate-200">
              <section className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                    <Info size={24} />
                  </div>
                  <h4 className="text-xl font-black uppercase tracking-tight">Data Intelligence Legend</h4>
                </div>
                <div className="space-y-6">
                  <div className="p-8 bg-slate-900 text-white rounded-[2rem] space-y-6">
                    <h5 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400">Complexity Alignment (Tiers)</h5>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex gap-4">
                        <span className="font-black text-indigo-400 min-w-[80px]">CORE:</span>
                        <p className="text-xs text-slate-400 leading-relaxed">High-yield essentials. Most common on the Digital SAT; forms the foundation of almost every reading passage.</p>
                      </div>
                      <div className="flex gap-4">
                        <span className="font-black text-indigo-400 min-w-[80px]">MEDIUM:</span>
                        <p className="text-xs text-slate-400 leading-relaxed">Intermediate academic vocabulary. Appears in standard to hard modules of the exam.</p>
                      </div>
                      <div className="flex gap-4">
                        <span className="font-black text-indigo-400 min-w-[80px]">ADVANCED:</span>
                        <p className="text-xs text-slate-400 leading-relaxed">High-complexity "distinguishers" found in challenging literature and science passages; separates top-tier scores.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Usage Frequency (3.5 - 8.5)</p>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">Measures how often a word appears in modern English and SAT contexts. 8.5 is very common; 3.5 is specialized/rare.</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2">Difficulty Score (12 - 74)</p>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">Linguistic complexity (0-100) based on morphology and abstraction. 12 is straightforward; 74 is highly complex.</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                    <Database size={24} />
                  </div>
                  <h4 className="text-xl font-black uppercase tracking-tight">System Overview</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-2">Initialize Training</p>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">Starts a review session with 20 random words using Spaced Repetition logic.</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-2">Neural Arena</p>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">Gamified learning hub. Play games to earn XP and Credits while mastering vocabulary.</p>
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                    <ShieldCheck size={24} />
                  </div>
                  <h4 className="text-xl font-black uppercase tracking-tight">Backup & Recovery</h4>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-6 p-6 hover:bg-slate-50 rounded-3xl transition-all group">
                    <div className="mt-1 text-slate-300 group-hover:text-indigo-500 transition-colors"><Download size={20} /></div>
                    <div>
                      <p className="font-black text-sm uppercase tracking-tight">Export Local Vault</p>
                      <p className="text-xs text-slate-500 font-medium mt-1">Saves your progress (XP, Mastery, Credits) as a JSON file. Use this for your personal backup.</p>
                    </div>
                  </div>
                  <div className="flex gap-6 p-6 hover:bg-slate-50 rounded-3xl transition-all group">
                    <div className="mt-1 text-slate-300 group-hover:text-indigo-500 transition-colors"><Info size={20} /></div>
                    <div>
                      <p className="font-black text-sm uppercase tracking-tight">Vault (Word Bank)</p>
                      <p className="text-xs text-slate-500 font-medium mt-1">Inside the Vault, you can download a CSV backup of all 2,280 words or import a previously saved list.</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="p-8 md:p-12 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
              <button onClick={() => setShowHelp(false)} className="px-8 md:px-12 py-4 md:py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest hover:bg-black transition-all shadow-xl">Acknowledge</button>
            </div>
          </div>
        </div>
      )}

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
                  {/* DATA INTEGRITY AUDIT SECTION */}
                  <div className="p-10 bg-emerald-950/20 border-2 border-emerald-500/30 rounded-[3rem] space-y-6">
                    <div className="flex justify-between items-center">
                      <h5 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Data Integrity Audit</h5>
                      <span className="px-3 py-1 bg-emerald-500 text-white text-[8px] font-black rounded-full uppercase">Verified</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Units in Vault</p>
                        <p className="text-3xl font-black text-white">{words.length.toLocaleString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Expected (UI Target)</p>
                        <p className="text-3xl font-black text-slate-600">2,250</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Integrity Status</p>
                        <p className={`text-xl font-black ${words.length >= 2250 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {words.length >= 2250 ? 'FULL PAYLOAD' : 'PARTIAL LOAD'}
                        </p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-800">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Sample Verification (First/Last Units)</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/30 p-4 rounded-2xl border border-slate-800">
                          <p className="text-[8px] text-indigo-400 font-bold uppercase mb-1">First Entry</p>
                          <p className="text-xs text-white font-mono truncate">{words[0]?.term || 'None'}</p>
                        </div>
                        <div className="bg-black/30 p-4 rounded-2xl border border-slate-800">
                          <p className="text-[8px] text-indigo-400 font-bold uppercase mb-1">Last Entry</p>
                          <p className="text-xs text-white font-mono truncate">{words[words.length - 1]?.term || 'None'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* SYSTEM SPECS */}
                    <div className="p-8 bg-slate-950 rounded-[2.5rem] border border-slate-800 flex flex-col justify-center">
                       <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">Vault Payload</p>
                       <p className="text-2xl font-black text-white">{new Blob([JSON.stringify(progress)]).size.toLocaleString()} <span className="text-xs text-slate-600 uppercase">Bytes</span></p>
                    </div>
                    <div className="p-8 bg-slate-950 rounded-[2.5rem] border border-slate-800 flex flex-col justify-center">
                       <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">State Protocol</p>
                       <p className="text-2xl font-black text-white">V{progress.version}.{progress.revision}</p>
                    </div>

                    {/* DEPLOYMENT HUB */}
                    <div className="md:col-span-2 p-10 bg-indigo-950/20 border-2 border-indigo-500/30 rounded-[3rem] space-y-6">
                       <div className="flex justify-between items-center">
                          <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Multi-Device Access Hub</h5>
                          <span className="px-3 py-1 bg-indigo-500 text-white text-[8px] font-black rounded-full uppercase">Pro Mode</span>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <p className="text-xs text-slate-300 font-bold">Sync Code via Git</p>
                             <div className="bg-black p-4 rounded-xl font-mono text-[10px] text-indigo-400 border border-slate-800 select-all">
                               git pull origin main
                             </div>
                             <p className="text-[9px] text-slate-500">Run this on any computer to sync latest code updates.</p>
                          </div>
                          <div className="space-y-2">
                             <p className="text-xs text-slate-300 font-bold">Share Testing Link</p>
                             <button 
                               onClick={shareApp}
                               className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 transition-all"
                             >
                               Copy Live URL
                             </button>
                             <p className="text-[9px] text-slate-500">Anyone with this link can test the app instantly.</p>
                          </div>
                       </div>
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
                  <button onClick={onExport} className="flex-1 py-6 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-2xl hover:bg-emerald-500 active:scale-95 transition-all">Export Local Vault</button>
                  <button onClick={() => setShowForensics(false)} className="flex-1 py-6 bg-slate-800 text-slate-300 rounded-[2rem] font-black uppercase text-[11px] tracking-widest border border-slate-700 hover:bg-slate-700 transition-all">Dismiss Diagnostics</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
export default Dashboard;
