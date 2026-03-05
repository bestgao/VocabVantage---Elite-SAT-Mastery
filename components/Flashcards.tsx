
import React, { useState, useEffect } from 'react';
import { Word, MasteryLevel } from '../types';
import { isSystemAIEnabled, generateSpeech, decode, decodeAudioData } from '../services/gemini';
import { MASTERY_COLORS } from '../constants';

interface FlashcardsProps {
  words: Word[];
  currentMastery: Record<string, MasteryLevel>;
  onWordUpdate: (id: string, level: MasteryLevel, term: string, isCorrect: boolean) => void;
  onWordPropertyUpdate: (id: string, updates: Partial<Word>) => void;
  onBack: () => void;
}

const Flashcards: React.FC<FlashcardsProps> = ({ words, currentMastery, onWordUpdate, onWordPropertyUpdate, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);

  const word = words[currentIndex];
  const level = currentMastery[word.id] ?? 0;
  const config = MASTERY_COLORS[level as MasteryLevel];
  const aiEnabled = isSystemAIEnabled();

  useEffect(() => { 
    setIsFlipped(false); 
  }, [currentIndex]);

  const handleLevel = (lvl: MasteryLevel) => { 
    const isCorrect = lvl >= (currentMastery[word.id] || 0);
    onWordUpdate(word.id, lvl, word.term, isCorrect); 
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onBack();
    }
  };

  const speak = async () => {
    if (!aiEnabled) {
      alert("Audio requires Neural Link (AI Enabled). Currently in Local Mode.");
      return;
    }
    setLoadingAudio(true);
    try {
      const b64 = await generateSpeech(`${word.term}. ${word.definition}`);
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const buf = await decodeAudioData(decode(b64), ctx, 24000, 1);
      const src = ctx.createBufferSource(); 
      src.buffer = buf; 
      src.connect(ctx.destination); 
      src.start();
    } finally {
      setLoadingAudio(false);
    }
  };

  const progressPercent = ((currentIndex + 1) / words.length) * 100;

  return (
    <div className="max-w-2xl mx-auto flex flex-col min-h-[85vh] pb-24 px-4 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="fixed top-16 md:top-20 left-0 right-0 h-1.5 bg-slate-200 z-[40]">
        <div 
          className="h-full bg-indigo-600 transition-all duration-700 ease-out progress-shimmer"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <header className="flex justify-between items-center mb-6 md:mb-10 pt-4">
        <button onClick={onBack} className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-950 transition-colors bg-white px-4 md:px-5 py-2 rounded-full border border-slate-100 shadow-sm">← Exit</button>
        <div className="flex flex-col items-end">
          <span className="text-[10px] md:text-[11px] font-black text-indigo-600 bg-indigo-50 px-3 md:px-4 py-1.5 rounded-full border border-indigo-100 shadow-sm">{currentIndex + 1} / {words.length}</span>
          <p className="text-[7px] md:text-[8px] font-bold text-slate-300 uppercase mt-1 tracking-[0.2em]">Efficiency Protocol V21</p>
        </div>
      </header>

      <div className="relative flex-1 perspective-1000">
        <div className={`relative w-full h-[32rem] md:h-[38rem] transition-all duration-700 preserve-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`} onClick={() => setIsFlipped(!isFlipped)}>
          
          {/* FRONT */}
          <div className={`absolute inset-0 bg-white rounded-[3rem] md:rounded-[4rem] shadow-2xl p-8 md:p-12 flex flex-col items-center justify-center backface-hidden border-[6px] md:border-[8px] ${config.border} transition-all hover:scale-[1.01]`}>
            <div className="absolute top-8 md:top-12 flex gap-4">
              <button onClick={(e) => { e.stopPropagation(); speak(); }} className="w-12 h-12 md:w-14 md:h-14 bg-slate-950 text-white rounded-2xl flex items-center justify-center shadow-2xl hover:bg-indigo-600 transition-all group">
                {loadingAudio ? <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <span className="text-lg md:text-xl group-hover:scale-125 transition-transform">🔊</span>}
              </button>
              <div className="px-4 md:px-5 py-2 md:py-3 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center justify-center">
                 <span className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest">Level</span>
                 <span className="text-base md:text-lg font-black text-slate-900">{level + 1}</span>
              </div>
            </div>
            
            <div className="w-20 h-20 md:w-28 md:h-28 mb-6 md:mb-10 bg-slate-50 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center text-4xl md:text-5xl shadow-inner border border-slate-100/50">
              {level === 3 ? '🏆' : '📚'}
            </div>
            
            <h2 className={`text-5xl sm:text-7xl md:text-8xl font-black text-center tracking-tighter mb-4 ${config.text} italic`}>{word.term}</h2>
            <div className="flex flex-wrap justify-center items-center gap-2 md:gap-3">
               <span className="px-2 md:px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest">[{word.partOfSpeech}]</span>
               <span className="px-2 md:px-3 py-1 bg-indigo-50 text-indigo-500 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest">{word.satLevel}</span>
               {word.multipleMeaningsFlag && (
                 <span className="px-2 md:px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest border border-amber-100">Polysemy</span>
               )}
            </div>
            
            <p className="mt-8 md:mt-12 text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] animate-pulse">Tap to Reveal</p>
          </div>

          {/* BACK */}
          <div className={`absolute inset-0 bg-white rounded-[3rem] md:rounded-[4rem] shadow-2xl p-8 md:p-12 flex flex-col backface-hidden rotate-y-180 border-[6px] md:border-[8px] ${config.border} overflow-y-auto no-scrollbar`}>
            <div className="space-y-8 md:space-y-10 text-center flex-1 flex flex-col pt-4">
                <div>
                  <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 md:mb-4">Core Interpretation</p>
                  <p className={`text-2xl sm:text-3xl md:text-4xl font-black leading-tight tracking-tight text-slate-900`}>
                    {word.definition}
                  </p>
                </div>
                
                <div className="p-6 md:p-8 bg-slate-50 rounded-[2rem] md:rounded-[3rem] border border-slate-100 text-slate-600 text-sm md:text-base font-medium leading-relaxed italic relative">
                  <span className="absolute -top-3 left-6 md:left-8 bg-white px-3 py-1 text-[7px] md:text-[8px] font-black uppercase tracking-widest border border-slate-100 text-slate-400">Contextual usage</span>
                  "{word.example}"
                </div>

                {/* NEW: Morphology & Domain */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-left">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Morphology</p>
                    <p className="text-xs font-bold text-slate-700">{word.morphology || 'N/A'}</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-left">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Academic Domain</p>
                    <p className="text-xs font-bold text-indigo-600">{word.academicDomain || 'General'}</p>
                  </div>
                </div>

                <div className="mt-auto space-y-4">
                  <div className="p-6 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100">
                     <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Local Mode</p>
                     <p className="text-[11px] font-medium text-slate-500 italic">Neural Sync (AI) is currently disabled to ensure maximum offline stability.</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setIsFlipped(false); }} className="w-full py-4 text-slate-400 font-black text-[11px] uppercase tracking-widest hover:text-slate-900 transition-colors">Return to term</button>
                </div>
              </div>
          </div>
        </div>
      </div>

      {/* MASTERY CONTROLS */}
      <div className="mt-8 grid grid-cols-4 gap-2 sm:gap-4 px-2">
        {[0, 1, 2, 3].map(lvl => (
          <button 
            key={lvl} 
            onClick={() => handleLevel(lvl as MasteryLevel)} 
            className={`py-5 md:py-7 rounded-[1.5rem] md:rounded-[2.5rem] border-2 transition-all flex flex-col items-center justify-center gap-1 md:gap-2 group ${level === lvl ? 'bg-slate-950 border-slate-950 text-white shadow-2xl scale-105 sm:scale-110 z-10' : 'bg-white border-slate-100 hover:border-slate-300 text-slate-400 shadow-sm'}`}
          >
            <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-transform group-hover:scale-125 ${level === lvl ? 'bg-white animate-pulse' : MASTERY_COLORS[lvl as MasteryLevel].text.replace('text-', 'bg-')}`}></div>
            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest">{MASTERY_COLORS[lvl as MasteryLevel].label.split(': ')[1]}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
export default Flashcards;
