
<<<<<<< HEAD
import React, { useState } from 'react';
import { UserProgress, AppScreen } from '../types';
import { validateSystemConnection } from '../services/gemini';

const getEncouragement = () => {
  const messages = [
    "Precision is the path to mastery.",
    "Consistency creates cognitive dominance.",
    "The mind is a repository for elite knowledge.",
    "Neural pathways are strengthening.",
    "Excellence is a habit, not an act.",
    "Mastery is within reach.",
    "Intelligence is a marathon, not a sprint.",
    "Focused training yields exceptional results."
  ];
  return messages[Math.floor(Math.random() * messages.length)];
};
=======
import React from 'react';
import { UserProgress, AppScreen } from '../types';
>>>>>>> 42d8b822d4898685e99734be5fcc95b82cace9e9

interface DashboardProps {
  progress: UserProgress;
  onNavigate: (screen: AppScreen) => void;
  onQuickStart: () => void;
<<<<<<< HEAD
  onDiscover: () => void; 
=======
  onDiscover: () => void;
>>>>>>> 42d8b822d4898685e99734be5fcc95b82cace9e9
  isDiscovering: boolean;
  onClaim: () => number;
  onUpgrade: () => void;
  onReset: () => void;
  onImportSync: (data: string) => void;
  appVersion: string;
  onUpdateGoal: (goal: number) => void;
}

<<<<<<< HEAD
const Dashboard: React.FC<DashboardProps> = ({ progress, onNavigate, onUpdateGoal, onQuickStart, onDiscover, onImportSync }) => {
=======
const Dashboard: React.FC<DashboardProps> = ({ progress, onNavigate, onUpdateGoal, onQuickStart }) => {
>>>>>>> 42d8b822d4898685e99734be5fcc95b82cace9e9
  const todayKey = new Date().toISOString().split('T')[0];
  const todayMasteredCount = progress.dailyMasteryProgress[todayKey] || 0;
  const todayReviewedCount = progress.dailyReviewedProgress[todayKey] || 0;
  const plan = progress.dailyMasteryGoal || 1;
  const isOverdrive = todayMasteredCount >= plan;
  const goalPercent = Math.min((todayMasteredCount / plan) * 100, 100);
  
<<<<<<< HEAD
  const [diagStatus, setDiagStatus] = useState<{ status: string, message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // IDENTIFICATION: This shows the first 4 digits of your key in the UI
  const keyHint = process.env.API_KEY ? `${process.env.API_KEY.substring(0, 4)}...` : 'NOT_FOUND';

  const runDiagnostic = async () => {
    setIsTesting(true);
    const result = await validateSystemConnection();
    setDiagStatus(result);
    setIsTesting(false);
  };
  
=======
>>>>>>> 42d8b822d4898685e99734be5fcc95b82cace9e9
  const historyDays = [...Array(14)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    return {
      date: key,
      label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      mastered: progress.dailyMasteryProgress[key] || 0,
      reviewed: progress.dailyReviewedProgress[key] || 0,
      goalMet: (progress.dailyMasteryProgress[key] || 0) >= plan
    };
  });

<<<<<<< HEAD
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) onImportSync(event.target.result as string);
    };
    reader.readAsText(file);
=======
  const getEncouragement = () => {
    if (todayMasteredCount === 0 && todayReviewedCount > 0) return "Active data intake detected. Lock in your mastery!";
    if (todayMasteredCount === 0) return "Neural repository online. Commencement recommended.";
    if (todayMasteredCount < plan) return "Momentum building. Daily objective in reach!";
    if (todayMasteredCount === plan) return "Objective Secured ✨ Goal reached for today.";
    if (todayMasteredCount > plan * 1.5) return "ASCENDANT: You are exceeding your cognitive plan!";
    return "OVERDRIVE: Exceptional discipline recognized.";
>>>>>>> 42d8b822d4898685e99734be5fcc95b82cace9e9
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-24">
<<<<<<< HEAD
      <div className="flex flex-wrap justify-between items-center -mb-8 px-6 gap-4">
         <div className="flex items-center gap-3">
            {/* DIAGNOSTIC BUTTON */}
            <button 
              onClick={runDiagnostic} 
              disabled={isTesting}
              className={`text-[10px] font-black uppercase tracking-widest px-5 py-2 rounded-full border shadow-sm transition-all flex items-center gap-2 ${
                diagStatus?.status === 'online' ? 'bg-emerald-500 text-white border-emerald-400' :
                diagStatus?.status === 'offline' ? 'bg-rose-500 text-white border-rose-400' :
                'bg-white text-slate-900 border-slate-200 hover:border-indigo-400'
              }`}
            >
              {isTesting ? '📡 Pinging...' : diagStatus ? `System: ${diagStatus.message}` : 'AI Neural Check'}
            </button>

            {/* KEY IDENTIFIER BADGE */}
            <div className="bg-slate-100 border border-slate-200 px-4 py-2 rounded-full flex items-center gap-2">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Active Key:</span>
               <span className="text-[10px] font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-inner">
                 {keyHint}
               </span>
            </div>
         </div>
         
         <div className="flex gap-4">
            <label className="cursor-pointer text-[9px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors tracking-widest flex items-center gap-2">
                <span>Import Backup</span>
                <input type="file" className="hidden" accept=".json" onChange={handleFileUpload} />
            </label>
            <button onClick={onDiscover} className="text-[9px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors tracking-widest flex items-center gap-2">
                <span>Export Progress</span>
            </button>
         </div>
      </div>

=======
      {/* --- ELITE STATUS OVERVIEW --- */}
>>>>>>> 42d8b822d4898685e99734be5fcc95b82cace9e9
      <section className="bg-slate-950 rounded-[4.5rem] p-10 md:p-14 text-white relative overflow-hidden shadow-[0_35px_60px_-15px_rgba(99,102,241,0.35)] border-b-8 border-indigo-600">
        <div className="absolute top-0 right-0 w-[55rem] h-[55rem] bg-indigo-500/10 rounded-full -mr-64 -mt-64 blur-[130px]"></div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600/20 text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-indigo-500/30">
                Cognitive State: {isOverdrive ? 'Transcendent' : 'Active'}
              </div>
              <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.8]">
                Neural <br/><span className="text-indigo-500">Output</span>
              </h1>
              <p className="text-slate-400 font-medium max-w-sm text-base leading-relaxed">
                Repository Secured: <span className="text-white font-black">{(progress.customWords?.length || 0).toLocaleString()}</span> Assets.
                Daily Goal: <span className="text-indigo-400 font-bold">{plan} Mastered</span>.
              </p>
            </div>

            <div className="flex gap-12">
               <div className="text-center group cursor-default">
                  <p className="text-6xl font-black text-white transition-transform group-hover:scale-110">{progress.streak}</p>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">Day Streak</p>
               </div>
               <div className="text-center border-l border-slate-800 pl-12 group cursor-default">
                  <p className="text-6xl font-black text-indigo-400 transition-transform group-hover:scale-110">{todayReviewedCount}</p>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">Reviewed</p>
               </div>
               <div className="text-center border-l border-slate-800 pl-12 group cursor-default">
                  <p className={`text-6xl font-black transition-transform group-hover:scale-110 ${isOverdrive ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>{todayMasteredCount}</p>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">Mastered</p>
               </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={onQuickStart}
                className="flex-[2] bg-white text-slate-950 px-10 py-8 rounded-[2.5rem] font-black text-lg uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-5 group ring-8 ring-white/5"
              >
                Commence Study <span className="text-2xl group-hover:animate-bounce">⚡</span>
              </button>
              <button 
                onClick={() => onNavigate(AppScreen.STUDY_SETUP)}
                className="flex-1 px-10 py-8 bg-slate-900 text-slate-400 rounded-[2.5rem] font-black text-xs uppercase tracking-widest border border-slate-800 hover:text-white hover:border-slate-600 transition-all"
              >
                Parameters
              </button>
            </div>
          </div>

          <div className={`p-10 md:p-14 rounded-[4.5rem] border space-y-10 transition-all duration-700 relative overflow-hidden ${isOverdrive ? 'bg-amber-400/10 border-amber-400/40 shadow-[0_0_60px_rgba(251,191,36,0.3)]' : 'bg-slate-900/50 border-slate-800 shadow-2xl'}`}>
             {isOverdrive && (
               <div className="absolute -top-4 -right-4 bg-amber-400 text-slate-950 px-6 py-2.5 rotate-12 font-black text-[11px] uppercase tracking-[0.2em] shadow-lg">
                 Target Exceeded
               </div>
             )}
             
             <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className={`text-2xl font-black tracking-tight ${isOverdrive ? 'text-amber-400' : 'text-white'}`}>
                    {isOverdrive ? 'Overdrive Active' : 'Goal Tracking'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="text-[12px] text-slate-400 font-bold uppercase tracking-widest">Plan: {plan}</span>
                    <span className="text-slate-700 text-xl">•</span>
                    <span className={`text-[12px] font-black uppercase tracking-widest ${isOverdrive ? 'text-amber-400' : 'text-emerald-400'}`}>Current: {todayMasteredCount}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800 group transition-all hover:border-indigo-500">
                   <input 
                     type="number" 
                     value={plan} 
                     onChange={(e) => onUpdateGoal(Number(e.target.value))}
                     className="w-10 bg-transparent text-center font-black text-indigo-400 outline-none"
                   />
                   <span className="text-[9px] font-black text-slate-600 uppercase">Set</span>
                </div>
             </div>
             
             <div className="h-32 bg-slate-800/40 rounded-[3.5rem] overflow-hidden relative border border-slate-700 p-2.5 shadow-inner">
                <div 
                  className={`h-full transition-all duration-1000 rounded-[3rem] flex items-center px-12 ${isOverdrive ? 'bg-gradient-to-r from-amber-500 to-amber-300 shadow-[0_0_40px_rgba(251,191,36,0.5)]' : 'bg-indigo-600'}`} 
                  style={{ width: `${goalPercent}%` }}
                >
                   {goalPercent > 18 && (
                     <span className="text-white font-black text-[12px] uppercase tracking-widest drop-shadow-md">
                       {isOverdrive ? 'ASCENDANT' : 'PROCESSING'}
                     </span>
                   )}
                </div>
                <div className="absolute inset-0 flex items-center justify-center font-black text-2xl uppercase tracking-[0.6em] drop-shadow-2xl text-white pointer-events-none">
                   {todayMasteredCount} / {plan}
                </div>
             </div>
             
             <p className={`text-sm text-center font-black uppercase tracking-[0.1em] px-10 leading-relaxed ${isOverdrive ? 'text-amber-400' : 'text-slate-500 italic'}`}>
               "{getEncouragement()}"
             </p>
          </div>
        </div>
      </section>

<<<<<<< HEAD
=======
      {/* --- DAILY EFFORT LOG --- */}
>>>>>>> 42d8b822d4898685e99734be5fcc95b82cace9e9
      <section className="space-y-8">
        <div className="flex justify-between items-end px-6">
           <h2 className="text-4xl font-black text-slate-900 tracking-tight">Intelligence Ledger</h2>
           <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">14-Day Performance History</p>
        </div>
        <div className="bg-white rounded-[4.5rem] border border-slate-100 shadow-2xl overflow-hidden">
           <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-slate-100">
              <div className="p-12 space-y-8">
                 {historyDays.slice(0, 7).map(day => (
                    <div key={day.date} className="flex items-center justify-between group">
                       <div className="space-y-1">
                          <span className="text-sm font-bold text-slate-500 group-hover:text-slate-900 transition-colors block">{day.label}</span>
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{day.reviewed} Reviewed</span>
                       </div>
                       <div className="flex items-center gap-8">
                          <span className={`text-sm font-black ${day.mastered > 0 ? (day.mastered >= plan ? 'text-amber-500' : 'text-emerald-500') : 'text-slate-200'}`}>{day.mastered} Mastered</span>
                          <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center text-[11px] transition-all transform group-hover:rotate-12 ${day.goalMet ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-200' : 'bg-slate-50 text-slate-100 border border-slate-100'}`}>
                             {day.goalMet ? '✓' : ''}
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
              <div className="p-12 space-y-8 bg-slate-50/20">
                 {historyDays.slice(7, 14).map(day => (
                    <div key={day.date} className="flex items-center justify-between group">
                       <div className="space-y-1">
                          <span className="text-sm font-bold text-slate-400 block">{day.label}</span>
                          <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">{day.reviewed} Reviewed</span>
                       </div>
                       <div className="flex items-center gap-8">
                          <span className={`text-sm font-black ${day.mastered > 0 ? 'text-emerald-300' : 'text-slate-100'}`}>{day.mastered} Mastered</span>
                          <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center text-[11px] ${day.goalMet ? 'bg-emerald-400/30 text-white' : 'bg-slate-50 text-slate-50'}`}>
                             {day.goalMet ? '✓' : ''}
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </section>

<<<<<<< HEAD
=======
      {/* QUICK LINKS */}
>>>>>>> 42d8b822d4898685e99734be5fcc95b82cace9e9
      <section className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="bg-white p-14 rounded-[4.5rem] border border-slate-100 shadow-lg flex flex-col justify-between hover:shadow-2xl transition-all border-b-8 border-indigo-100 group">
          <div>
            <div className="text-5xl mb-8 group-hover:scale-110 transition-transform">📦</div>
            <h4 className="text-3xl font-black text-slate-900 tracking-tight">Vault</h4>
            <p className="text-slate-400 text-base font-medium leading-relaxed mt-2">Manage your dataset of {(progress.customWords?.length || 0).toLocaleString()} terms.</p>
          </div>
          <button onClick={() => onNavigate(AppScreen.WORD_BANK)} className="mt-12 py-6 bg-slate-950 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-indigo-600 transition-colors shadow-lg">Open Repository</button>
        </div>
        <div className="bg-white p-14 rounded-[4.5rem] border border-slate-100 shadow-lg flex flex-col justify-between hover:shadow-2xl transition-all border-b-8 border-emerald-100 group">
          <div>
            <div className="text-5xl mb-8 group-hover:scale-110 transition-transform">🎮</div>
            <h4 className="text-3xl font-black text-slate-900 tracking-tight">Games Hub</h4>
            <p className="text-slate-400 text-base font-medium leading-relaxed mt-2">Gamified SAT intake simulations for rapid mastery.</p>
          </div>
          <button onClick={() => onNavigate(AppScreen.GAMES)} className="mt-12 py-6 bg-emerald-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-emerald-100">Enter Games Hub</button>
        </div>
        <div className="bg-white p-14 rounded-[4.5rem] border border-slate-100 shadow-lg flex flex-col justify-between hover:shadow-2xl transition-all border-b-8 border-amber-100 group">
          <div>
            <div className="text-5xl mb-8 group-hover:scale-110 transition-transform">🥇</div>
            <h4 className="text-3xl font-black text-slate-900 tracking-tight">Consistency</h4>
            <p className="text-slate-400 text-base font-medium leading-relaxed mt-2">Performance milestones and large credit payouts.</p>
          </div>
          <button onClick={() => onNavigate(AppScreen.ACHIEVEMENTS)} className="mt-12 py-6 bg-amber-500 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em]">Claim Prizes</button>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
