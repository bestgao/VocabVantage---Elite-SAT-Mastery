
import React, { useState } from 'react';
import { Word, MasteryLevel, SessionConfig } from '../types';

interface StudySessionSetupProps {
  words: Word[];
  progress: Record<string, MasteryLevel>;
  lastConfig: SessionConfig;
  onStart: (selection: Word[], config: SessionConfig) => void;
  onBack: () => void;
}

const StudySessionSetup: React.FC<StudySessionSetupProps> = ({ words, progress, lastConfig, onStart, onBack }) => {
  const [levels, setLevels] = useState<string[]>(lastConfig.levels);
  const [freqs, setFreqs] = useState<string[]>(lastConfig.freqs);
  const [masteries, setMasteries] = useState<number[]>(lastConfig.masteries);

  const toggle = (list: any[], set: Function, val: any) => {
    if (list.includes(val)) {
      if (list.length > 1) set(list.filter(v => v !== val));
    } else {
      set([...list, val]);
    }
  };

  const startSession = () => {
    const config: SessionConfig = { levels, freqs, masteries };
    const selection = words.filter(w => {
      const m = progress[w.id] || 0;
      return levels.includes(w.satLevel) && freqs.includes(w.frequencyTier) && masteries.includes(m);
    });

    if (selection.length === 0) {
      alert("Search Query Null: No assets found matching these categories.");
      return;
    }

    // Use larger pool for selection
    const final = selection.sort(() => 0.5 - Math.random()).slice(0, 30);
    onStart(final, config);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="text-center space-y-3">
        <h2 className="text-6xl font-black text-slate-900 tracking-tight">Session Parameters</h2>
        <p className="text-slate-500 font-medium">Fine-tune your training mix. Last used settings loaded by default.</p>
      </div>

      <div className="bg-white rounded-[4rem] p-12 md:p-16 shadow-2xl border border-slate-100 space-y-14 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8">
           <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Memory-Linked Profile Loaded
           </div>
        </div>

        {/* SAT DIFFICULTY LEVEL */}
        <div className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <p className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em]">Complexity Alignment</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {['Core', 'Medium', 'Advanced'].map(lvl => (
              <button 
                key={lvl}
                onClick={() => toggle(levels, setLevels, lvl)}
                className={`py-8 rounded-[2.5rem] border-2 font-black text-sm uppercase tracking-widest transition-all ${levels.includes(lvl) ? 'bg-indigo-600 border-indigo-700 text-white shadow-xl scale-105' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-indigo-200'}`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* MASTERY STATE FOCUS */}
        <div className="space-y-6">
          <p className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em] px-2">Mastery Target State</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[0, 1, 2].map(m => (
              <button 
                key={m}
                onClick={() => toggle(masteries, setMasteries, m)}
                className={`py-8 rounded-[2.5rem] border-2 font-black text-sm uppercase tracking-widest transition-all ${masteries.includes(m) ? 'bg-slate-900 border-slate-950 text-white shadow-xl scale-105' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-900'}`}
              >
                {m === 0 ? 'Protocol Entry' : m === 1 ? 'Developing' : 'Review Phase'}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-10 border-t border-slate-100 flex flex-col sm:flex-row gap-6">
           <button onClick={startSession} className="flex-[2] py-8 bg-indigo-600 text-white rounded-[2.5rem] font-black text-base uppercase tracking-widest shadow-2xl hover:bg-indigo-700 active:scale-95 transition-all">
             Commit & Begin Neural Sync
           </button>
           <button onClick={onBack} className="flex-1 py-8 bg-slate-100 text-slate-400 rounded-[2.5rem] font-black text-xs uppercase hover:bg-slate-200 transition-all">
             Abort
           </button>
        </div>
      </div>
    </div>
  );
};

export default StudySessionSetup;
