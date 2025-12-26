import React, { useState, useEffect, useRef } from 'react';
import { Word, MasteryLevel } from '../types';
import { generateSATQuestion, generateWordImage, generateSpeech, decode, decodeAudioData, fetchSynonymsAndMnemonics } from '../services/gemini';
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
  const [loadingRefine, setLoadingRefine] = useState(false);
  const [loadingImg, setLoadingImg] = useState(false);
  const [satQ, setSatQ] = useState<any>(null);
  const [img, setImg] = useState<string | null>(null);
  const [ans, setAns] = useState<number | null>(null);
  const [confetti, setConfetti] = useState<boolean>(false);

  const word = words[currentIndex];
  const level = currentMastery[word.id] ?? 0;
  const config = MASTERY_COLORS[level as MasteryLevel];

  useEffect(() => { 
    setIsFlipped(false); 
    setSatQ(null); 
    setImg(null); 
    setAns(null); 
  }, [currentIndex]);

  const triggerConfetti = () => {
    setConfetti(true);
    setTimeout(() => setConfetti(false), 3000);
  };

  const handleLevel = (lvl: MasteryLevel) => { 
    if (lvl === 3 && level < 3) triggerConfetti();
    onWordUpdate(word.id, lvl); 
    currentIndex < words.length - 1 ? setCurrentIndex(prev => prev + 1) : onBack(); 
  };

  const speak = async () => {
    const b64 = await generateSpeech(`${word.term}. ${word.definition}`);
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const buf = await decodeAudioData(decode(b64), ctx, 24000, 1);
    const src = ctx.createBufferSource(); 
    src.buffer = buf; 
    src.connect(ctx.destination); 
    src.start();
  };

  const refine = async () => {
    setLoadingRefine(true);
    try {
      const data = await fetchSynonymsAndMnemonics(word.term, word.definition);
      onWordPropertyUpdate(word.id, { 
        synonyms: data.synonyms, 
        mnemonic: data.mnemonic 
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRefine(false);
    }
  };

  const drill = async () => { 
    setLoadingAI(true); 
    setIsFlipped(true); 
    try { 
      setSatQ(await generateSATQuestion(word.term, word.definition)); 
    } finally { 
      setLoadingAI(false); 
    } 
  };
  
  const vision = async () => { 
    setLoadingImg(true); 
    try { 
      const url = await generateWordImage(word.term, word.definition);
      setImg(url);
    } finally { 
      setLoadingImg(false); 
    } 
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col min-h-[85vh] pb-24 relative">
      {confetti && [...Array(30)].map((_, i) => (
        <div 
          key={i} 
          className="confetti" 
          style={{ 
            left: `${Math.random() * 100}vw`, 
            backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'][Math.floor(Math.random() * 4)],
            animationDelay: `${Math.random() * 2}s`
          }} 
        />
      ))}

      <header className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">← Exit Lab</button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{currentIndex + 1} / {words.length}</span>
          <p className="text-[8px] font-bold text-slate-300 uppercase mt-1 tracking-tighter">Current mastery: Lvl {level + 1}</p>
        </div>
      </header>

      <div className="relative flex-1 perspective-1000">
        <div className={`relative w-full h-[40rem] transition-all duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* FRONT */}
          <div onClick={() => setIsFlipped(true)} className={`absolute inset-0 bg-white rounded-[4rem] shadow-2xl p-12 flex flex-col items-center justify-center backface-hidden border-[6px] ${config.border} cursor-pointer hover:shadow-indigo-100 transition-all`}>
            <div className="absolute top-10 flex gap-4">
              <button onClick={(e) => { e.stopPropagation(); speak(); }} className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-all">🔊</button>
              <button onClick={(e) => { e.stopPropagation(); vision(); }} className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-all">
                {loadingImg ? <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div> : '🎨'}
              </button>
            </div>
            
            {img ? (
              <img src={img} className="w-full h-64 object-cover rounded-3xl mb-8 animate-in zoom-in-95" />
            ) : (
              <div className="w-24 h-24 mb-8 bg-slate-50 rounded-full flex items-center justify-center text-4xl opacity-20 group-hover:opacity-40 transition-opacity">📦</div>
            )}
            
            <h2 className={`text-7xl font-black text-center tracking-tighter mb-4 ${config.text}`}>{word.term}</h2>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">[{word.partOfSpeech}]</p>
            
            {word.mnemonic && (
               <div className="mt-8 p-6 bg-amber-50 rounded-[2rem] text-amber-800 text-xs font-bold text-center italic border border-amber-100 max-w-xs animate-in fade-in slide-in-from-bottom-4">
                 <span className="block text-[8px] uppercase not-italic mb-1 opacity-50 tracking-widest">Neural Mnemonic</span>
                 "{word.mnemonic}"
               </div>
            )}
          </div>

          {/* BACK */}
          <div className={`absolute inset-0 bg-white rounded-[4rem] shadow-2xl p-10 flex flex-col backface-hidden rotate-y-180 border-[6px] ${config.border} overflow-y-auto no-scrollbar`}>
            {satQ ? (
              <div className="space-y-6">
                <p className="font-bold text-slate-800 text-lg leading-relaxed">"{satQ.question}"</p>
                <div className="space-y-3">
                  {satQ.options.map((o: string, i: number) => (
                    <button key={i} onClick={() => setAns(i)} disabled={ans !== null} className={`w-full p-5 rounded-2xl text-left font-bold border-2 transition-all ${ans === null ? 'border-slate-100 hover:border-indigo-500 hover:bg-indigo-50' : i === satQ.correctIndex ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : i === ans ? 'bg-rose-50 border-rose-500 text-rose-900' : 'opacity-40'}`}>{o}</button>
                  ))}
                </div>
                {ans !== null && (
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 animate-in fade-in">
                    <p className="text-[10px] font-black uppercase text-indigo-500 mb-2">Neural Explanation</p>
                    <p className="text-xs italic text-slate-600 leading-relaxed">{satQ.explanation}</p>
                    <button onClick={() => setSatQ(null)} className="mt-4 text-[10px] font-black uppercase text-slate-400 font-bold hover:text-slate-900">Next Word Preview</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-10 text-center flex-1 flex flex-col pt-8">
                <div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Core Interpretation</p>
                  <p className={`text-3xl font-black leading-tight ${config.text}`}>{word.definition}</p>
                </div>
                
                <div className="p-8 bg-slate-50 rounded-[2.5rem] italic text-slate-600 text-sm border border-slate-100 leading-relaxed">
                  "{word.example}"
                </div>

                {word.synonyms && word.synonyms.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[8px] font-black uppercase text-slate-300 tracking-widest">Neural Synonyms</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {word.synonyms.map((s, i) => (
                        <span key={i} className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-tight border border-indigo-100">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-auto space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={refine} 
                      disabled={loadingRefine}
                      className="py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-black uppercase text-[10px] border border-indigo-100 hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
                    >
                      {loadingRefine ? <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div> : 'Refine 🧬'}
                    </button>
                    <button onClick={drill} className="py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] hover:bg-black shadow-lg transition-all">
                      {loadingAI ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div> : 'Neural Drill ⚡'}
                    </button>
                  </div>
                  <button onClick={() => setIsFlipped(false)} className="w-full py-4 text-slate-400 font-black text-[10px] uppercase hover:text-slate-600 transition-colors">Back to Term</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-4 gap-4">
        {[0, 1, 2, 3].map(lvl => (
          <button 
            key={lvl} 
            onClick={() => handleLevel(lvl as MasteryLevel)} 
            className={`py-6 rounded-[2rem] border-2 transition-all group ${level === lvl ? 'bg-slate-950 border-slate-950 text-white shadow-xl shadow-indigo-200/20 scale-105' : 'bg-white border-slate-100 hover:border-slate-300'}`}
          >
            <div className={`w-2 h-2 rounded-full mx-auto mb-2 ${level === lvl ? 'bg-white animate-pulse' : MASTERY_COLORS[lvl as MasteryLevel].text.replace('text-', 'bg-')}`}></div>
            <span className="text-[10px] font-black uppercase tracking-widest">{MASTERY_COLORS[lvl as MasteryLevel].label.split(': ')[1]}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
export default Flashcards;