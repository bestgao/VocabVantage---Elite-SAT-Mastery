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
  const plan = progress.dailyMasteryGoal || 10;
  const todayKey = new Date().toISOString().split('T')[0];
  const masteredToday = progress.dailyMasteryProgress[todayKey] || 0;
  const reviewedToday = progress.dailyReviewedProgress[todayKey] || 0;

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <section className="bg-slate-950 rounded-[4.5rem] p-10 md:p-14 text-white relative overflow-hidden shadow-2xl border-b-[12px] border-indigo-600 animate-titan">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-10">
            <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-none">Neural <br/><span className="text-indigo-500">Output</span></h1>
            <div className="flex gap-12">
               <div className="text-center">
                  <p className="text-7xl font-black">{progress.streak}</p>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Active Streak</p>
               </div>
               <div className="text-center border-l border-slate-800 pl-12">
                  <p className="text-7xl font-black text-emerald-400">{masteredToday}</p>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Mastered Today</p>
               </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={onQuickStart} className="flex-[2] bg-white text-slate-950 px-10 py-8 rounded-[2.5rem] font-black text-lg uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all shadow-xl shadow-white/5">Commence Lab ⚡</button>
              <button onClick={() => onNavigate(AppScreen.STUDY_SETUP)} className="flex-1 px-10 py-8 bg-slate-900 text-slate-400 rounded-[2.5rem] font-black text-xs uppercase tracking-widest border border-slate-800 hover:text-white transition-all">Config</button>
            </div>
          </div>
          <div className="p-12 rounded-[4.5rem] bg-slate-900/40 border border-slate-800 space-y-8 backdrop-blur-xl">
             <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black tracking-tight">Daily Quota</h3>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-500 uppercase">Goal:</span>
                  <input type="number" value={plan} onChange={(e) => onUpdateGoal(Number(e.target.value))} className="w-16 bg-slate-950/50 p-2 rounded-xl text-indigo-400 font-black text-center outline-none border border-indigo-500/20" />
                </div>
             </div>
             <div className="h-14 bg-slate-950 rounded-3xl overflow-hidden p-1.5 border border-slate-800">
                <div className="h-full bg-indigo-600 rounded-2xl transition-all duration-1000 relative group" style={{ width: `${Math.min((masteredToday/plan)*100, 100)}%` }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                </div>
             </div>
             <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 tracking-widest">
                <span>{masteredToday} Secured</span>
                <span>{reviewedToday} Reviews Processed</span>
             </div>
          </div>
        </div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px]"></div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: '📦', title: 'Vault', desc: 'Manage Repository', screen: AppScreen.WORD_BANK, color: 'bg-slate-950', hover: 'hover:shadow-indigo-500/10' },
          { icon: '🎯', title: 'Games', desc: 'Neural Training', screen: AppScreen.GAMES, color: 'bg-emerald-600', hover: 'hover:shadow-emerald-500/10' },
          { icon: '🏅', title: 'Medals', desc: 'Achievement Log', screen: AppScreen.ACHIEVEMENTS, color: 'bg-amber-500', hover: 'hover:shadow-amber-500/10' }
        ].map((box, i) => (
          <div key={i} className={`bg-white p-12 rounded-[4.5rem] border border-slate-100 shadow-sm flex flex-col justify-between transition-all duration-500 hover:shadow-2xl ${box.hover} group`}>
            <div>
              <div className="text-6xl mb-8 group-hover:scale-110 transition-transform inline-block">{box.icon}</div>
              <h4 className="text-4xl font-black tracking-tighter text-slate-900">{box.title}</h4>
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mt-2">{box.desc}</p>
            </div>
            <button onClick={() => onNavigate(box.screen)} className={`mt-12 py-6 ${box.color} text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-lg active:scale-95 transition-all`}>Initialize</button>
          </div>
        ))}
      </section>
    </div>
  );
};
export default Dashboard;