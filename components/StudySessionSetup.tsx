
import React, { useState } from 'react';
import { Word, MasteryLevel, SessionConfig } from '../types';
import Tooltip from './Tooltip';

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
  const [domains, setDomains] = useState<string[]>(lastConfig.domains || ['General']);
  const [highYieldOnly, setHighYieldOnly] = useState<boolean>(!!lastConfig.highYieldOnly);

  const toggle = (list: any[], set: Function, val: any) => {
    if (list.includes(val)) {
      set(list.filter(v => v !== val));
    } else {
      set([...list, val]);
    }
  };

  const startSession = () => {
    const config: SessionConfig = { levels, freqs, masteries, domains, highYieldOnly };
    const selection = words.filter(w => {
      const m = progress[w.id] || 0;
      const matchesLevel = levels.length === 0 || levels.includes(w.satLevel);
      const matchesFreq = freqs.length === 0 || freqs.includes(w.frequencyTier);
      const matchesMastery = masteries.length === 0 || masteries.includes(m);
      const matchesDomain = domains.length === 0 || domains.includes(w.academicDomain || 'General');
      const matchesHighYield = !highYieldOnly || (w.usageFrequencyScore !== undefined && w.usageFrequencyScore > 7);
      
      return matchesLevel && matchesFreq && matchesMastery && matchesDomain && matchesHighYield;
    });

    if (selection.length === 0) {
      alert("No words match your current filters. Try broadening your selection (e.g., unchecking all focus areas to include everything).");
      return;
    }

    // Use larger pool for selection
    const final = selection.sort(() => 0.5 - Math.random()).slice(0, 30);
    onStart(final, config);
  };

  const allDomains = Array.from(new Set(words.map(w => w.academicDomain || 'General'))).sort();

  const getMasteryLabel = (m: number) => {
    switch(m) {
      case 0: return 'Hard';
      case 1: return 'Learning';
      case 2: return 'Review';
      case 3: return 'Mastered';
      default: return 'Unknown';
    }
  };

  const getMasteryTooltip = (m: number) => {
    switch(m) {
      case 0: return 'Words you marked as difficult or haven\'t seen yet.';
      case 1: return 'Words you are currently practicing.';
      case 2: return 'Words you know but need periodic review.';
      case 3: return 'Words you have fully mastered.';
      default: return '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 md:space-y-12 px-4 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      <div className="text-center space-y-2 md:space-y-3">
        <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">Parameters</h2>
        <p className="text-slate-500 font-medium text-sm">Fine-tune your training mix. Last used settings loaded.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-16 shadow-2xl border border-slate-100 space-y-10 md:space-y-14 relative overflow-hidden">
        <div className="hidden md:block absolute top-0 right-0 p-8">
           <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Memory-Linked Profile Loaded
           </div>
        </div>

        {/* SAT DIFFICULTY LEVEL */}
        <div className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <p className="text-[10px] md:text-[11px] font-black uppercase text-slate-400 tracking-[0.4em]">Complexity Alignment</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            {['Core', 'Medium', 'Advanced'].map(lvl => (
              <Tooltip 
                key={lvl} 
                text={
                  lvl === 'Core' ? 'High-yield essentials. Most common on the Digital SAT; forms the foundation of almost every reading passage.' :
                  lvl === 'Medium' ? 'Intermediate academic vocabulary. Appears in standard to hard modules of the exam.' :
                  'High-complexity "distinguishers" found in challenging literature and science passages; separates top-tier scores.'
                }
              >
                <button 
                  onClick={() => toggle(levels, setLevels, lvl)}
                  className={`w-full py-6 md:py-8 rounded-[1.5rem] md:rounded-[2.5rem] border-2 font-black text-xs md:text-sm uppercase tracking-widest transition-all ${levels.includes(lvl) ? 'bg-indigo-600 border-indigo-700 text-white shadow-xl scale-105' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-indigo-200'}`}
                >
                  {lvl}
                </button>
              </Tooltip>
            ))}
          </div>
        </div>

        {/* ACADEMIC DOMAIN */}
        <div className="space-y-6">
          <p className="text-[10px] md:text-[11px] font-black uppercase text-slate-400 tracking-[0.4em] px-2">Academic Domain Focus</p>
          <div className="flex flex-wrap gap-2 md:gap-3">
            {allDomains.map(dom => (
              <Tooltip key={dom} text={`Include words from the ${dom} domain.`}>
                <button 
                  onClick={() => toggle(domains, setDomains, dom)}
                  className={`px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl border-2 font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all ${domains.includes(dom) ? 'bg-indigo-100 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-indigo-100'}`}
                >
                  {dom}
                </button>
              </Tooltip>
            ))}
          </div>
        </div>

        {/* FREQUENCY & HIGH YIELD */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <p className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em] px-2">Frequency Tier</p>
            <div className="flex gap-3">
              {['High', 'Mid', 'Low'].map(f => (
                <Tooltip 
                  key={f} 
                  text={
                    f === 'High' ? 'Usage Frequency 8.5+: Very common words that appear frequently in SAT exams.' :
                    f === 'Mid' ? 'Usage Frequency 6.0+: Standard academic vocabulary often found in SAT modules.' :
                    'Usage Frequency 3.5+: Specialized or rare words that appear in specific contexts.'
                  }
                >
                  <button 
                    onClick={() => toggle(freqs, setFreqs, f)}
                    className={`flex-1 py-4 px-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${freqs.includes(f) ? 'bg-slate-900 border-slate-950 text-white' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                  >
                    {f}
                  </button>
                </Tooltip>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <p className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em] px-2">Yield Optimization</p>
            <Tooltip text="Prioritize words most likely to appear on the digital SAT.">
              <button 
                onClick={() => setHighYieldOnly(!highYieldOnly)}
                className={`w-full py-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${highYieldOnly ? 'bg-emerald-600 border-emerald-700 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
              >
                <span className={`w-2 h-2 rounded-full ${highYieldOnly ? 'bg-white animate-ping' : 'bg-slate-300'}`}></span>
                {highYieldOnly ? 'High-Yield Priority Active' : 'Standard Distribution'}
              </button>
            </Tooltip>
          </div>
        </div>

        {/* MASTERY STATE FOCUS */}
        <div className="space-y-6">
          <p className="text-[10px] md:text-[11px] font-black uppercase text-slate-400 tracking-[0.4em] px-2">Mastery Target State</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
            {[0, 1, 2, 3].map(m => (
              <Tooltip key={m} text={getMasteryTooltip(m)}>
                <button 
                  onClick={() => toggle(masteries, setMasteries, m)}
                  className={`w-full py-6 md:py-8 rounded-[1.5rem] md:rounded-[2.5rem] border-2 font-black text-[10px] md:text-xs uppercase tracking-widest transition-all ${masteries.includes(m) ? 'bg-slate-900 border-slate-950 text-white shadow-xl scale-105' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-900'}`}
                >
                  {getMasteryLabel(m)}
                </button>
              </Tooltip>
            ))}
          </div>
        </div>

        <div className="pt-8 md:pt-10 border-t border-slate-100 flex flex-col sm:flex-row gap-4 md:gap-6">
           <button onClick={startSession} className="flex-[2] py-6 md:py-8 bg-indigo-600 text-white rounded-[1.5rem] md:rounded-[2.5rem] font-black text-sm md:text-base uppercase tracking-widest shadow-2xl hover:bg-indigo-700 active:scale-95 transition-all">
             Commit & Begin
           </button>
           <button onClick={onBack} className="flex-1 py-6 md:py-8 bg-slate-100 text-slate-400 rounded-[1.5rem] md:rounded-[2.5rem] font-black text-[10px] md:text-xs uppercase hover:bg-slate-200 transition-all">
             Abort
           </button>
        </div>
      </div>
    </div>
  );
};

export default StudySessionSetup;
