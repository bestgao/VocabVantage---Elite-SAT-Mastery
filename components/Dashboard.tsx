import React, { useState } from 'react';
import { UserProgress, AppScreen } from '../types';
import { validateSystemConnection } from '../services/gemini';

interface DashboardProps {
  progress: UserProgress;
  onNavigate: (screen: AppScreen) => void;
  onQuickStart: () => void;
  onDiscover: () => void; 
  isDiscovering: boolean;
  onClaim: () => number;
  onUpgrade: () => void;
  onReset: () => void;
  onImportSync: (data: string) => void;
  appVersion: string;
  onUpdateGoal: (goal: number) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ progress, onNavigate, onUpdateGoal, onQuickStart }) => {
  const [diagStatus, setDiagStatus] = useState<{ status: string, message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const plan = progress.dailyMasteryGoal || 10;
  const todayKey = new Date().toISOString().split('T')[0];
  const masteredToday = progress.dailyMasteryProgress[todayKey] || 0;

  const runDiag = async () => {
    setIsTesting(true);
    setDiagStatus(await validateSystemConnection());
    setIsTesting(false);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex justify-between items-center px-6">
        <button onClick={runDiag} disabled={isTesting} className={`text-[10px] font-black uppercase px-5 py-2 rounded-full border ${diagStatus?.status === 'online' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900'}`}>
          {isTesting ? '📡 Pinging...' : diagStatus ? `System: ${diagStatus.message}` : 'AI Neural Check'}
        </button>
        <div className="bg-slate-100 px-4 py-2 rounded-full text-[10px] font-mono">{process.env.API_KEY?.substring(0, 4)}...</div>
      </div>

      <section className="bg-slate-950 rounded-[4.5rem] p-10 md:p-14 text-white relative overflow-hidden shadow-2xl border-b-8 border-indigo-600">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-10">
            <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-none">Neural <br/><span className="text-indigo-500">Output</span></h1>
            <div className="flex gap-12">
               <div className="text-center">
                  <p className="text-6xl font-black">{progress.streak}</p>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Day Streak</p>
               </div>
               <div className="text-center border-l border-slate-800 pl-12">
                  <p className="text-6xl font-black text-emerald-400">{masteredToday}</p>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Mastered</p>
               </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={onQuickStart} className="flex-[2] bg-white text-slate-950 px-10 py-8 rounded-[2.5rem] font-black text-lg uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all">Commence Study ⚡</button>
              <button onClick={() => onNavigate(AppScreen.STUDY_SETUP)} className="flex-1 px-10 py-8 bg-slate-900 text-slate-400 rounded-[2.5rem] font-black text-xs uppercase tracking-widest border border-slate-800 hover:text-white">Parameters</button>
            </div>
          </div>
          <div className="p-10 rounded-[4.5rem] bg-slate-900/50 border border-slate-800 space-y-8">
             <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black">Daily Goal</h3>
                <input type="number" value={plan} onChange={(e) => onUpdateGoal(Number(e.target.value))} className="w-16 bg-slate-950 p-2 rounded-xl text-indigo-400 font-black text-center outline-none" />
             </div>
             <div className="h-12 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${Math.min((masteredToday/plan)*100, 100)}%` }}></div>
             </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="bg-white p-14 rounded-[4.5rem] border border-slate-100 shadow-lg flex flex-col justify-between hover:shadow-2xl transition-all">
          <div><div className="text-5xl mb-8">📦</div><h4 className="text-3xl font-black">Vault</h4></div>
          <button onClick={() => onNavigate(AppScreen.WORD_BANK)} className="mt-12 py-6 bg-slate-950 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest">Open Repository</button>
        </div>
        <div className="bg-white p-14 rounded-[4.5rem] border border-slate-100 shadow-lg flex flex-col justify-between hover:shadow-2xl transition-all">
          <div><div className="text-5xl mb-8">🎮</div><h4 className="text-3xl font-black">Games</h4></div>
          <button onClick={() => onNavigate(AppScreen.GAMES)} className="mt-12 py-6 bg-emerald-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest">Enter Hub</button>
        </div>
        <div className="bg-white p-14 rounded-[4.5rem] border border-slate-100 shadow-lg flex flex-col justify-between hover:shadow-2xl transition-all">
          <div><div className="text-5xl mb-8">🥇</div><h4 className="text-3xl font-black">Medals</h4></div>
          <button onClick={() => onNavigate(AppScreen.ACHIEVEMENTS)} className="mt-12 py-6 bg-amber-500 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest">Claim Prizes</button>
        </div>
      </section>
    </div>
  );
};
export default Dashboard;