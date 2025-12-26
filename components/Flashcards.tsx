
import React, { useState, useEffect } from 'react';
import { Word, MasteryLevel } from '../types';
import { generateSATQuestion, refineWordProperties, generateSpeech, decode } from '../services/gemini';
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
  const [loadingAI, setLoadingAI] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [satQuestion, setSatQuestion] = useState<{q: string, options: string[], correct: number} | null>(null);
  const [proposedUpdate, setProposedUpdate] = useState<Partial<Word> | null>(null);
  const [userAnswer, setUserAnswer] = useState<number | null>(null);
  
  const word = words[currentIndex];
  const level = (currentMastery[word.id] ?? 0) as MasteryLevel;
  const colorConfig = MASTERY_COLORS[level];

  useEffect(() => {
    setIsFlipped(false);
    setSatQuestion(null);
    setProposedUpdate(null);
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

  /**
   * Generates and plays audio for the current word and definition.
   */
  const handleListen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      const text = `${word.term}. ${word.partOfSpeech}. ${word.definition}`;
      const base64 = await generateSpeech(text);
      const audioBytes = decode(base64);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const dataInt16 = new Int16Array(audioBytes.buffer);
      const buffer = audioCtx.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
      }
      
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.onended = () => setIsSpeaking(false);
      source.start();
    } catch (err) {
      console.error("Speech failed", err);
      setIsSpeaking(false);
    }
  };

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

  const handleAIRefine = async () => {
    if (isRefining) return;
    setIsRefining(true);
    try {
      const proposal = await refineWordProperties(word);
      setProposedUpdate(proposal);
    } catch (e) {
      console.error("Refinement failed", e);
      alert("AI failed to generate a refinement.");
    } finally {
      setIsRefining(false);
    }
  };

  const applyUpdate = () => {
    if (proposedUpdate) {
      onWordPropertyUpdate(word.id, proposedUpdate);
      setProposedUpdate(null);
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-10 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest shadow-2xl animate-in slide-in-from-bottom-4 duration-300 z-[200]';
      toast.innerText = '✨ Word Bank Refined';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2500);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col min-h-[85vh] px-4 pb-20 pt-4">
      {/* --- ELITE REFINEMENT OVERLAY --- */}
      {proposedUpdate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-3xl p-4 md:p-8 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] p-8 md:p-14 shadow-2xl space-y-10 animate-in zoom-in-95 duration-500 overflow-y-auto max-h-[90vh] no-scrollbar">
            <div className="text-center space-y-2">
               <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">✨</div>
               <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Neural Refinement</h3>
               <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em]">Upgrading Repository Asset: {word.term}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-4">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-2">Original State</p>
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 opacity-60">
                     <p className="text-xs font-medium text-slate-500 leading-relaxed italic break-words">
                        {word.definition} <br/><br/>
                        "{word.example}"
                     </p>
                  </div>
               </div>
               <div className="space-y-4">
                  <p className="text-[9px] font-black uppercase text-indigo-600 tracking-widest px-2">Proposed "Elite" Version</p>
                  <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100 shadow-sm ring-2 ring-indigo-500/10">
                     <p className="text-sm font-bold text-slate-900 leading-relaxed mb-4 break-words">{proposedUpdate.definition}</p>
                     <p className="text-xs font-medium text-indigo-800 leading-relaxed italic break-words">"{proposedUpdate.example}"</p>
                  </div>
               </div>
            </div>

            {proposedUpdate.mnemonic && (
              <div className="p-6 bg-slate-900 rounded-[2rem] text-white">
                 <p className="text-[9px] font-black uppercase text-amber-400 mb-3 tracking-widest">Titan Mnemonic (New)</p>
                 <p className="text-sm font-medium leading-relaxed italic text-slate-300 break-words">"{proposedUpdate.mnemonic}"</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pb-4">
               <button onClick={applyUpdate} className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95">
                 Apply to Bank
               </button>
               <button onClick={() => setProposedUpdate(null)} className="px-8 py-5 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-200">
                 Discard
               </button>
            </div>
          </div>
        </div>
      )}

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
              className={`absolute inset-0 bg-white rounded-[4rem] shadow-2xl p-12 flex flex-col items-center justify-center backface-hidden border-[6px] transition-all duration-500 cursor-pointer ${colorConfig.border} overflow-hidden group`}
            >
              <div className="absolute top-8 left-0 right-0 flex justify-center items-center gap-2">
                 <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                   word.satLevel === 'Core' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                   word.satLevel === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                 }`}>
                   {word.satLevel}
                 </span>
                 {/* Listen Button added to front */}
                 <button 
                  onClick={handleListen} 
                  className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-90"
                  title="Listen"
                 >
                   {isSpeaking ? '🔊' : '🔈'}
                 </button>
              </div>

              <h2 className={`text-6xl md:text-8xl font-black text-center tracking-tighter mb-4 transition-all duration-500 ${colorConfig.text} group-hover:scale-105 break-words`}>
                {word.term}
              </h2>
              
              <p className="text-slate-300 font-black uppercase tracking-[0.3em] text-[10px]">[{word.partOfSpeech}]</p>
              
              <p className="absolute bottom-12 text-slate-400 font-bold uppercase tracking-widest text-[9px] animate-pulse">Tap to Reveal Intelligence</p>
            </div>

            <div className={`absolute inset-0 bg-white rounded-[4rem] shadow-2xl p-8 md:p-12 flex flex-col backface-hidden rotate-y-180 border-[6px] transition-all duration-500 ${colorConfig.border} overflow-y-auto no-scrollbar`}>
              <div className="space-y-6 flex flex-col min-h-full">
                {satQuestion ? (
                  <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                    <div className="text-center">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">AI Practice Session</h3>
                      <div className="h-1 w-12 bg-indigo-100 rounded-full mx-auto"></div>
                    </div>
                    <p className="text-lg font-bold text-slate-800 leading-tight break-words">{satQuestion.q}</p>
                    <div className="grid grid-cols-1 gap-2">
                      {satQuestion.options.map((opt, idx) => {
                        let styles = "p-4 rounded-xl border-2 text-left text-sm font-bold transition-all break-words ";
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
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-start">
                    <div className="text-center mb-6 pt-4 px-2">
                      <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4">Strategic Meaning</h3>
                      <p className={`font-black leading-tight transition-colors duration-500 break-words ${colorConfig.text} ${word.definition.length > 50 ? 'text-xl md:text-2xl text-left' : 'text-2xl md:text-4xl'}`}>
                        {word.definition}
                      </p>
                    </div>
                    <div className="p-6 md:p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 text-left relative group mb-4">
                       <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Contextual Sample</h3>
                       <p className="text-slate-600 font-medium leading-relaxed italic text-sm md:text-base break-words whitespace-pre-wrap">"{word.example}"</p>
                       {word.mnemonic && (
                         <div className="mt-4 pt-4 border-t border-slate-200">
                           <p className="text-[9px] font-black uppercase text-amber-500 mb-1">Elite Mnemonic</p>
                           <p className="text-[11px] font-bold text-slate-500 leading-tight italic break-words">{word.mnemonic}</p>
                         </div>
                       )}
                    </div>
                    {/* Listen Button in Back */}
                    <button 
                      onClick={handleListen} 
                      className="mt-2 py-4 bg-slate-100 text-slate-700 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-200"
                    >
                      {isSpeaking ? '🔊 Playing...' : '🔈 Listen to Definition'}
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 mt-auto pt-4 sticky bottom-0 bg-white/90 backdrop-blur-md pb-2">
                   <button 
                     onClick={(e) => { e.stopPropagation(); setIsFlipped(false); }}
                     className="py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:text-slate-900 transition-colors"
                   >
                     Flip
                   </button>
                   <button 
                     onClick={(e) => { e.stopPropagation(); handleAIDrill(); }}
                     disabled={loadingAI}
                     className="py-4 bg-slate-950 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest disabled:opacity-50 hover:bg-black"
                   >
                     {loadingAI ? '...' : 'Quiz ✨'}
                   </button>
                   <button 
                     onClick={(e) => { e.stopPropagation(); handleAIRefine(); }}
                     disabled={isRefining}
                     className="py-4 bg-indigo-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-indigo-100 disabled:opacity-50 hover:bg-indigo-700"
                   >
                     {isRefining ? '...' : 'Refine ✨'}
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
            {currentIndex === words.length - 1 ? 'End Protocol' : 'Next Word →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Flashcards;
