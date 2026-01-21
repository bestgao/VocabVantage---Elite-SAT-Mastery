
import React, { useState, useEffect } from 'react';
import { Word, MasteryLevel } from '../types';
import { isSystemAIEnabled, generateSpeech, decode, decodeAudioData } from '../services/gemini';
import { MASTERY_COLORS } from '../constants';

interface FlashcardsProps {
  words: Word[];
  currentMastery: Record<string, MasteryLevel>;
  onWordUpdate: (id: string, level: MasteryLevel) => void;
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
    onWordUpdate(word.id, lvl); 
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
    <div className="max-w-2xl mx-auto flex flex-col min-h-[85vh] pb-24 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="fixed top-20 left-0 right-0 h-1.5 bg-slate-200 z-[40]">
        <div 
          className="h-full bg-indigo-600 transition-all duration-700 ease-out progress-shimmer"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <header className="flex justify-between items-center mb-10 pt-4">
        <button onClick={onBack} className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-950 transition-colors bg-white px-5 py-2 rounded-full border border-slate-100 shadow-sm">← Exit Session</button>
        <div className="flex flex-col items-end">
          <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100 shadow-sm">{currentIndex + 1} / {words.length}</span>
          <p className="text-[8px] font-bold text-slate-300 uppercase mt-1 tracking-[0.2em]">Efficiency Protocol V21</p>
        </div>
      </header>

      <div className="relative flex-1 perspective-1000">
        <div className={`relative w-full h-[38rem] transition-all duration-700 preserve-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`} onClick={() => setIsFlipped(!isFlipped)}>
          
          {/* FRONT */}
          <div className={`absolute inset-0 bg-white rounded-[4rem] shadow-2xl p-12 flex flex-col items-center justify-center backface-hidden border-[8px] ${config.border} transition-all hover:scale-[1.01]`}>
            <div className="absolute top-12 flex gap-4">
              <button onClick={(e) => { e.stopPropagation(); speak(); }} className="w-14 h-14 bg-slate-950 text-white rounded-2xl flex items-center justify-center shadow-2xl hover:bg-indigo-600 transition-all group">
                {loadingAudio ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <span className="text-xl group-hover:scale-125 transition-transform">🔊</span>}
              </button>
              <div className="px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center justify-center">
                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Level</span>
                 <span className="text-lg font-black text-slate-900">{level + 1}</span>
              </div>
            </div>
            
            <div className="w-28 h-28 mb-10 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-5xl shadow-inner border border-slate-100/50">
              {level === 3 ? '🏆' : '📚'}
            </div>
            
            <h2 className={`text-7xl md:text-8xl font-black text-center tracking-tighter mb-4 ${config.text} italic`}>{word.term}</h2>
            <div className="flex items-center gap-3">
               <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest">[{word.partOfSpeech}]</span>
               <span className="px-3 py-1 bg-indigo-50 text-indigo-500 rounded-lg text-[9px] font-black uppercase tracking-widest">{word.satLevel}</span>
            </div>
            
            <p className="mt-12 text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] animate-pulse">Tap to Reveal Definition</p>
          </div>

          {/* BACK */}
          <div className={`absolute inset-0 bg-white rounded-[4rem] shadow-2xl p-12 flex flex-col backface-hidden rotate-y-180 border-[8px] ${config.border} overflow-y-auto no-scrollbar`}>
            <div className="space-y-10 text-center flex-1 flex flex-col pt-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Core Interpretation</p>
                  <p className={`text-3xl md:text-4xl font-black leading-tight tracking-tight text-slate-900`}>
                    {word.definition}
                  </p>
                </div>
                
                <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 text-slate-600 text-base font-medium leading-relaxed italic relative">
                  <span className="absolute -top-3 left-8 bg-white px-3 py-1 text-[8px] font-black uppercase tracking-widest border border-slate-100 text-slate-400">Contextual usage</span>
                  "{word.example}"
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
      <div className="mt-12 grid grid-cols-4 gap-4 px-2">
        {[0, 1, 2, 3].map(lvl => (
          <button 
            key={lvl} 
            onClick={() => handleLevel(lvl as MasteryLevel)} 
            className={`py-7 rounded-[2.5rem] border-2 transition-all flex flex-col items-center justify-center gap-2 group ${level === lvl ? 'bg-slate-950 border-slate-950 text-white shadow-2xl scale-110 z-10' : 'bg-white border-slate-100 hover:border-slate-300 text-slate-400 shadow-sm'}`}
          >
            <div className={`w-3 h-3 rounded-full transition-transform group-hover:scale-125 ${level === lvl ? 'bg-white animate-pulse' : MASTERY_COLORS[lvl as MasteryLevel].text.replace('text-', 'bg-')}`}></div>
            <span className="text-[10px] font-black uppercase tracking-widest">{MASTERY_COLORS[lvl as MasteryLevel].label.split(': ')[1]}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
export default Flashcards;
