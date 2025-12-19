
import React, { useState, useEffect } from 'react';
import { Word, MasteryLevel } from '../types';
import { generateSATQuestion } from '../services/gemini';
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
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [satQuestion, setSatQuestion] = useState<{q: string, options: string[], correct: number} | null>(null);
  
  const word = words[currentIndex];
  
  // Directly pull level from parent state to ensure immediate visual sync
  const level = (currentMastery[word.id] ?? 0) as MasteryLevel;
  const colorConfig = MASTERY_COLORS[level];

  const CONFIDENCE_LABELS: Record<number, string> = {
    0: 'Hard',
    1: 'Learning',
    2: 'Reviewing',
    3: 'Mastered'
  };

  useEffect(() => {
    setIsFlipped(false);
    setSatQuestion(null);
  }, [currentIndex]);

  const handleLevelSelect = (newLevel: MasteryLevel) => {
    // Parent update
    onWordUpdate(word.id, newLevel);
    
    // Auto-advance is strictly manual unless the toggle is on
    if (autoAdvance) {
      setTimeout(() => {
        handleNext();
      }, 800);
    }
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

  const handleSATMode = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loadingAI) return;
    
    setLoadingAI(true);
    try {
      const data = await generateSATQuestion(word.term, word.definition);
      if (data && data.question) {
        setSatQuestion({ q: data.question, options: data.options, correct: data.correctIndex });
        setIsFlipped(true); 
      } else {
        alert("The AI Tutor is preparing more questions. Please try another word!");
      }
    } catch (err) {
      console.error(err);
      alert("AI Connection failed. Please check your internet connection.");
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col min-h-[85vh] px-4 pb-20">
      <header className="flex justify-between items-center py-4">
        <button onClick={onBack} className="text-slate-400 font-bold px-4 py-2 hover:text-slate-900 transition-colors">← Exit</button>
        <div className="flex items-center gap-3">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest hidden sm:inline">Speed Mode</span>
            <button 
                onClick={() => setAutoAdvance(!autoAdvance)}
                className={`w-10 h-5 rounded-full transition-all relative ${autoAdvance ? 'bg-indigo-600' : 'bg-slate-200'}`}
            >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${autoAdvance ? 'left-6' : 'left-1'}`}></div>
            </button>
        </div>
        <span className="bg-slate-100 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest text-slate-500 uppercase">
          {currentIndex + 1} of {words.length}
        </span>
      </header>

      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-6">
        <div className="bg-indigo-600 h-full transition-all duration-700 ease-out" style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }} />
      </div>

      <div className="relative flex-1">
        <button 
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={`absolute -left-2 md:-left-16 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border border-slate-100 transition-all ${currentIndex === 0 ? 'opacity-0 scale-90 pointer-events-none' : 'hover:scale-110 active:scale-90'}`}
        >
          <span className="text-slate-900 font-bold">←</span>
        </button>

        <button 
          onClick={handleNext}
          className="absolute -right-2 md:-right-16 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border border-slate-100 hover:scale-110 active:scale-90 transition-all"
        >
          <span className="text-slate-900 font-bold">→</span>
        </button>

        <div className="h-[28rem] md:h-[32rem] perspective-1000">
          <div className={`relative w-full h-full transition-all duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
            
            <div 
              onClick={() => !loadingAI && setIsFlipped(true)}
              className={`absolute inset-0 bg-white rounded-[3rem] shadow-2xl p-8 flex flex-col items-center justify-center backface-hidden border-4 transition-all duration-500 cursor-pointer ${colorConfig.border}`}
            >
              <div className={`mb-6 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${colorConfig.bg} ${colorConfig.text} border ${colorConfig.border} transition-colors duration-500`}>
                {colorConfig.label}
              </div>
              
              <h2 className={`text-5xl md:text-7xl font-black text-center tracking-tighter mb-4 transition-colors duration-500 ${colorConfig.text}`}>
                {word.term}
              </h2>
              
              <p className="text-slate-400 font-medium italic mb-12">[{word.partOfSpeech}]</p>
              
              <div className="flex flex-col gap-4 w-full max-w-xs">
                <button 
                  onClick={handleSATMode} 
                  disabled={loadingAI}
                  className={`relative w-full py-4.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 ${loadingAI ? 'bg-indigo-100 text-indigo-400' : 'bg-indigo-600 text-white active:scale-95 shadow-indigo-200'}`}
                >
                  {loadingAI ? 'AI Analysis...' : '⚡ SAT Practice Mode'}
                </button>
              </div>
            </div>

            <div className={`absolute inset-0 bg-white rounded-[3rem] shadow-2xl p-8 flex flex-col backface-hidden rotate-y-180 border-4 transition-all duration-500 ${colorConfig.border} overflow-y-auto no-scrollbar`}>
              {satQuestion ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest px-3 py-1 bg-indigo-50 rounded-lg">SAT Simulation</span>
                    <button onClick={() => setSatQuestion(null)} className="text-xs font-bold text-slate-400 px-2 py-1">Back</button>
                  </div>
                  <p className="text-lg md:text-xl font-medium text-slate-800 leading-relaxed">{satQuestion.q}</p>
                  <div className="space-y-2.5">
                    {satQuestion.options.map((opt, i) => (
                      <div key={i} className={`p-4 rounded-2xl border-2 text-sm font-bold transition-all ${i === satQuestion.correct ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                        <span className="mr-3 opacity-40">{String.fromCharCode(65 + i)}.</span> {opt}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setSatQuestion(null)} className="w-full py-4.5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest mt-4">Return</button>
                </div>
              ) : (
                <div className="space-y-8 flex flex-col h-full text-center">
                  <div className="pt-6 flex-1">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Definition</h3>
                    <p className={`text-2xl md:text-3xl font-bold leading-tight transition-colors duration-500 ${colorConfig.text}`}>{word.definition}</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Usage</h3>
                    <p className="text-slate-600 italic text-sm md:text-base leading-relaxed">"{word.example}"</p>
                  </div>
                  <button onClick={() => setIsFlipped(false)} className="w-full py-4 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-t border-slate-50 mt-4">Flip Back</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 space-y-6">
        <div className="text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5">Rate your confidence for "{word.term}"</p>
          <div className="grid grid-cols-4 gap-3">
            {[0, 1, 2, 3].map(lvlIdx => {
              const targetLvl = lvlIdx as MasteryLevel;
              const isCurrent = level === targetLvl;
              const cfg = MASTERY_COLORS[targetLvl];
              
              return (
                <button
                  key={targetLvl}
                  onClick={() => handleLevelSelect(targetLvl)}
                  className={`py-5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${isCurrent ? 'border-slate-900 bg-slate-900 text-white shadow-2xl scale-105 z-10' : 'border-slate-100 bg-white hover:border-slate-300 active:scale-95'}`}
                >
                  <div className={`w-3 h-3 rounded-full ${cfg.text.replace('text-', 'bg-')} ${isCurrent ? 'ring-4 ring-white/20' : ''}`}></div>
                  <span className="text-xs font-black">{targetLvl + 1}</span>
                  <span className="text-[8px] font-black uppercase opacity-60">
                    {CONFIDENCE_LABELS[targetLvl]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button 
          onClick={handleNext}
          className="w-full py-5.5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-slate-200 active:scale-95 transition-all mt-2"
        >
          {currentIndex === words.length - 1 ? 'Finish Session' : 'Next Word →'}
        </button>
      </div>
    </div>
  );
};

export default Flashcards;
