
import React, { useState, useEffect } from 'react';
import { Word, MasteryLevel } from '../types';
// Fixed: Imported missing generateSATQuestion service to resolve line 4 error
import { generateSATQuestion, getRealWorldUsage } from '../services/gemini';
import { MASTERY_COLORS } from '../constants';

interface FlashcardsProps {
  words: Word[];
  currentMastery: Record<string, MasteryLevel>;
  onWordUpdate: (id: string, level: MasteryLevel) => void;
  onBack: () => void;
}

const Flashcards: React.FC<FlashcardsProps> = ({ words, currentMastery, onWordUpdate, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [satQuestion, setSatQuestion] = useState<{q: string, options: string[], correct: number} | null>(null);
  const [userAnswer, setUserAnswer] = useState<number | null>(null);
  
  const word = words[currentIndex];
  const level = (currentMastery[word.id] ?? 0) as MasteryLevel;
  const colorConfig = MASTERY_COLORS[level];

  useEffect(() => {
    setIsFlipped(false);
    setSatQuestion(null);
    setUserAnswer(null);
  }, [currentIndex]);

  const handleLevelSelect = (newLevel: MasteryLevel) => {
    onWordUpdate(word.id, newLevel);
    setTimeout(() => handleNext(), 300);
  };

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onBack();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Fixed: Implemented AI Drill logic to fetch a practice question from Gemini
  const handleAIDrill = async () => {
    if (loadingAI) return;
    setLoadingAI(true);
    setSatQuestion(null);
    setUserAnswer(null);
    try {
      const q = await generateSATQuestion(word.term, word.definition);
      setSatQuestion(q);
    } catch (e) {
      console.error("AI Drill generation failed", e);
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col min-h-[85vh] px-4 pb-20 pt-4">
      <header className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-colors">← Exit Lab</button>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">{currentIndex + 1} / {words.length}</span>
          <div className="w-24 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}></div>
          </div>
        </div>
      </header>

      <div className="relative flex-1">
        <div className="h-[30rem] md:h-[34rem] perspective-1000">
          <div className={`relative w-full h-full transition-all duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
            
            <div 
              onClick={() => setIsFlipped(true)}
              className={`absolute inset-0 bg-white rounded-[4rem] shadow-2xl p-12 flex flex-col items-center justify-center backface-hidden border-[6px] transition-all duration-500 cursor-pointer ${colorConfig.border} overflow-hidden`}
            >
              {/* METADATA BADGES */}
              <div className="absolute top-8 left-0 right-0 flex justify-center gap-2">
                 <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                   word.satLevel === 'Core' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                   word.satLevel === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                 }`}>
                   Tier: {word.satLevel}
                 </span>
                 <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                   word.frequencyTier === 'High' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'
                 }`}>
                   {word.frequencyTier} Priority
                 </span>
              </div>

              <h2 className={`text-6xl md:text-8xl font-black text-center tracking-tighter mb-4 transition-colors duration-500 ${colorConfig.text}`}>
                {word.term}
              </h2>
              
              <p className="text-slate-300 font-black uppercase tracking-[0.3em] text-[10px]">[{word.partOfSpeech}]</p>
              
              <p className="absolute bottom-12 text-slate-400 font-bold uppercase tracking-widest text-[9px] animate-pulse">Tap to Reveal Intelligence</p>
            </div>

            <div className={`absolute inset-0 bg-white rounded-[4rem] shadow-2xl p-10 flex flex-col backface-hidden rotate-y-180 border-[6px] transition-all duration-500 ${colorConfig.border} overflow-y-auto no-scrollbar`}>
              <div className="space-y-8 flex flex-col h-full">
                {satQuestion ? (
                  <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                    <div className="text-center">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">AI Practice Session</h3>
                      <div className="h-1 w-12 bg-indigo-100 rounded-full mx-auto"></div>
                    </div>
                    <p className="text-lg font-bold text-slate-800 leading-tight">{satQuestion.q}</p>
                    <div className="grid grid-cols-1 gap-2">
                      {satQuestion.options.map((opt, idx) => {
                        let styles = "p-4 rounded-xl border-2 text-left text-sm font-bold transition-all ";
                        if (userAnswer !== null) {
                          if (idx === satQuestion.correct) styles += "bg-emerald-50 border-emerald-500 text-emerald-700";
                          else if (idx === userAnswer) styles += "bg-rose-50 border-rose-500 text-rose-700";
                          else styles += "bg-slate-50 border-transparent text-slate-300";
                        } else {
                          styles += "bg-white border-slate-100 hover:border-indigo-500 text-slate-700";
                        }
                        return (
                          <button 
                            key={idx} 
                            onClick={(e) => { e.stopPropagation(); setUserAnswer(idx); }} 
                            disabled={userAnswer !== null} 
                            className={styles}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {userAnswer !== null && (
                      <div className="text-center py-2 animate-in slide-in-from-top-2">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${userAnswer === satQuestion.correct ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {userAnswer === satQuestion.correct ? 'Correct! Definition Mastered ✨' : 'Incorrect choice. Review carefully.'}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center flex-1 flex flex-col justify-center">
                    <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4">Strategic Meaning</h3>
                    <p className={`text-2xl md:text-4xl font-black leading-tight transition-colors duration-500 ${colorConfig.text}`}>
                      {word.definition}
                    </p>
                    <div className="p-8 mt-8 bg-slate-50 rounded-[3rem] border border-slate-100">
                       <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Contextual Sample</h3>
                       <p className="text-slate-600 font-medium leading-relaxed italic">"{word.example}"</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mt-auto pt-4">
                   <button 
                     onClick={(e) => { e.stopPropagation(); setIsFlipped(false); }}
                     className="py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest"
                   >
                     Flip back
                   </button>
                   <button 
                     onClick={(e) => { e.stopPropagation(); handleAIDrill(); }}
                     disabled={loadingAI}
                     className="py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 disabled:opacity-50"
                   >
                     {loadingAI ? 'Analysing...' : 'AI Drill ✨'}
                   </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 space-y-8">
        <div className="grid grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(lvlIdx => {
            const targetLvl = lvlIdx as MasteryLevel;
            const isCurrent = level === targetLvl;
            const cfg = MASTERY_COLORS[targetLvl];
            return (
              <button
                key={targetLvl}
                onClick={() => handleLevelSelect(targetLvl)}
                className={`py-6 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${isCurrent ? 'border-slate-950 bg-slate-950 text-white shadow-2xl scale-105' : 'border-slate-100 bg-white hover:border-slate-300'}`}
              >
                <div className={`w-3 h-3 rounded-full ${cfg.text.replace('text-', 'bg-')}`}></div>
                <span className="text-[10px] font-black uppercase tracking-tighter">Level {targetLvl + 1}</span>
              </button>
            );
          })}
        </div>
        
        <div className="flex gap-4">
          <button onClick={handlePrev} disabled={currentIndex === 0} className="w-20 py-5 bg-slate-100 text-slate-400 rounded-3xl font-black text-xs disabled:opacity-0 transition-opacity">←</button>
          <button 
            onClick={handleNext}
            className="flex-1 py-5 bg-slate-950 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all"
          >
            {currentIndex === words.length - 1 ? 'End Protocol' : 'Next Acquisition →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Flashcards;
