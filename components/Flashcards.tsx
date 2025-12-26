import React, { useState, useEffect } from 'react';
import { Word, MasteryLevel } from '../types';
import { generateSATQuestion, generateWordImage, generateSpeech, decode, decodeAudioData } from '../services/gemini';
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
  const [loadingImage, setLoadingImage] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [satQuestion, setSatQuestion] = useState<any>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [userAnswer, setUserAnswer] = useState<number | null>(null);
  
  const word = words[currentIndex];
  const level = (currentMastery[word.id] ?? 0) as MasteryLevel;
  const colorConfig = MASTERY_COLORS[level];

  useEffect(() => {
    setIsFlipped(false);
    setSatQuestion(null);
    setImageUrl(null);
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

  const handleListen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      const text = `${word.term}. Definition: ${word.definition}`;
      const base64 = await generateSpeech(text);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const audioBuffer = await decodeAudioData(decode(base64), audioCtx, 24000, 1);
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.onended = () => setIsSpeaking(false);
      source.start();
    } catch (err) {
      console.error("Speech Lab Fail:", err);
      setIsSpeaking(false);
    }
  };

  const handleAIDrill = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loadingAI) return;
    setLoadingAI(true);
    setIsFlipped(true);
    try {
      const q = await generateSATQuestion(word.term, word.definition);
      setSatQuestion(q);
    } catch (e) {
      console.error("Neural Drill Fail:", e);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleVisualMetaphor = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loadingImage) return;
    setLoadingImage(true);
    try {
      const url = await generateWordImage(word.term, word.definition);
      setImageUrl(url);
    } catch (e) {
      console.error("Vision Lab Fail:", e);
    } finally {
      setLoadingImage(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col min-h-[85vh] px-4 pb-24 pt-4">
      <header className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-colors">← Exit Laboratory</button>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">{currentIndex + 1} / {words.length}</span>
          <div className="w-24 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}></div>
          </div>
        </div>
      </header>

      <div className="relative flex-1 perspective-1000">
        <div className={`relative w-full h-[34rem] md:h-[38rem] transition-all duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* FRONT (TERM) */}
          <div 
            onClick={() => setIsFlipped(true)}
            className={`absolute inset-0 bg-white rounded-[4rem] shadow-2xl p-12 flex flex-col items-center justify-center backface-hidden border-[6px] transition-all duration-500 cursor-pointer ${colorConfig.border} overflow-hidden`}
          >
            <div className="absolute top-10 flex gap-3">
              <button onClick={handleListen} className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                {isSpeaking ? '🔊' : '🔈'}
              </button>
              <button onClick={handleVisualMetaphor} className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                {loadingImage ? '⏳' : '🎨'}
              </button>
            </div>

            {imageUrl ? (
              <div className="w-full h-56 rounded-3xl overflow-hidden mb-8 shadow-inner border border-slate-100">
                <img src={imageUrl} alt={word.term} className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-700" />
              </div>
            ) : null}

            <h2 className={`text-6xl md:text-8xl font-black text-center tracking-tighter mb-4 transition-all duration-500 ${colorConfig.text} break-words`}>
              {word.term}
            </h2>
            <p className="text-slate-300 font-black uppercase tracking-[0.3em] text-[10px]">[{word.partOfSpeech}]</p>
            <p className="absolute bottom-12 text-slate-300 font-bold uppercase tracking-widest text-[9px] animate-pulse">Tap for Semantic Depth</p>
          </div>

          {/* BACK (DEFINITION & DRILL) */}
          <div className={`absolute inset-0 bg-white rounded-[4rem] shadow-2xl p-8 md:p-12 flex flex-col backface-hidden rotate-y-180 border-[6px] transition-all duration-500 ${colorConfig.border} overflow-y-auto no-scrollbar`}>
            {satQuestion ? (
              <div className="flex-1 space-y-6 animate-in fade-in duration-500">
                 <div className="text-center">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-4 py-1.5 rounded-full">Neural Analysis Active</span>
                 </div>
                 <p className="text-lg font-bold text-slate-800 leading-tight">"{satQuestion.question}"</p>
                 <div className="space-y-3">
                    {satQuestion.options.map((opt: string, idx: number) => {
                      let styles = "w-full p-4 rounded-2xl border-2 text-left text-sm font-bold transition-all ";
                      if (userAnswer !== null) {
                        if (idx === satQuestion.correctIndex) styles += "bg-emerald-50 border-emerald-500 text-emerald-700";
                        else if (idx === userAnswer) styles += "bg-rose-50 border-rose-500 text-rose-700";
                        else styles += "bg-slate-50 border-transparent text-slate-300";
                      } else {
                        styles += "bg-white border-slate-100 hover:border-indigo-500";
                      }
                      return (
                        <button key={idx} onClick={() => setUserAnswer(idx)} disabled={userAnswer !== null} className={styles}>
                          {opt}
                        </button>
                      );
                    })}
                 </div>
                 {userAnswer !== null && (
                   <div className="p-4 bg-slate-50 rounded-2xl text-[11px] font-medium text-slate-600 leading-relaxed italic animate-in slide-in-from-bottom-2">
                     <span className="font-black text-indigo-600 uppercase block mb-1">Tutor Insights:</span>
                     {satQuestion.explanation}
                   </div>
                 )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-start space-y-8">
                <div className="text-center pt-8">
                  <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4">Core Meaning</h3>
                  <p className={`font-black text-2xl md:text-3xl leading-tight ${colorConfig.text}`}>
                    {word.definition}
                  </p>
                </div>
                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                  <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Context Application</h3>
                  <p className="text-slate-600 font-medium leading-relaxed italic text-sm">"{word.example}"</p>
                </div>
                <div className="flex gap-4">
                  <button onClick={handleAIDrill} disabled={loadingAI} className="flex-1 py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">
                    {loadingAI ? 'Reasoning...' : 'Neural Context Drill ⚡'}
                  </button>
                </div>
              </div>
            )}
            
            <button 
              onClick={() => setIsFlipped(false)}
              className="mt-6 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:text-slate-900 transition-colors"
            >
              Back to Term
            </button>
          </div>
        </div>
      </div>

      {/* MASTERY ACTIONS */}
      <div className="mt-12 grid grid-cols-4 gap-4">
        {[0, 1, 2, 3].map(lvlIdx => (
          <button
            key={lvlIdx}
            onClick={() => handleLevelSelect(lvlIdx as MasteryLevel)}
            className={`py-6 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${level === lvlIdx ? 'border-slate-950 bg-slate-950 text-white shadow-2xl scale-105' : 'border-slate-100 bg-white hover:border-slate-300'}`}
          >
            <div className={`w-3 h-3 rounded-full ${MASTERY_COLORS[lvlIdx as MasteryLevel].text.replace('text-', 'bg-')}`}></div>
            <span className="text-[10px] font-black uppercase tracking-tighter">Level {lvlIdx + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Flashcards;