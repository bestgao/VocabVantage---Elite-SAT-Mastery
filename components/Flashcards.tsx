
import React, { useState, useEffect } from 'react';
import { Word, MasteryLevel } from '../types';
import { generateMnemonic, generateWordImage, generateSATQuestion } from '../services/gemini';
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
  
  const word = words[currentIndex];
  const level = currentMastery[word.id] || 0;

  useEffect(() => {
    setIsFlipped(false);
    setSatQuestion(null);
  }, [currentIndex]);

  const handleLevelSelect = (newLevel: MasteryLevel) => {
    onWordUpdate(word.id, newLevel);
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onBack();
    }
  };

  const handleSATMode = async () => {
    setLoadingAI(true);
    try {
      const data = await generateSATQuestion(word.term, word.definition);
      setSatQuestion({ q: data.question, options: data.options, correct: data.correctIndex });
      setIsFlipped(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center text-sm font-bold text-slate-400">
        <button onClick={onBack} className="hover:text-slate-900 transition-colors">← Exit</button>
        <span>WORD {currentIndex + 1} OF {words.length}</span>
      </div>

      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
        <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }} />
      </div>

      <div 
        className="relative h-[28rem] perspective-1000 group cursor-pointer"
        onClick={() => !satQuestion && setIsFlipped(!isFlipped)}
      >
        <div className={`relative w-full h-full transition-all duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          {/* FRONT */}
          <div className="absolute inset-0 bg-white rounded-[3rem] shadow-xl p-12 flex flex-col items-center justify-center backface-hidden border border-slate-100">
            <div className={`mb-4 px-3 py-1 rounded-full text-[10px] font-black uppercase ${MASTERY_COLORS[level].bg} ${MASTERY_COLORS[level].text}`}>
              {MASTERY_COLORS[level].label}
            </div>
            <h2 className="text-6xl font-black text-slate-900 text-center tracking-tighter">{word.term}</h2>
            <p className="mt-4 text-slate-400 font-medium italic">[{word.partOfSpeech}]</p>
            <div className="mt-12 flex gap-4">
              <button onClick={(e) => { e.stopPropagation(); handleSATMode(); }} className="px-6 py-2 bg-slate-900 text-white rounded-full text-xs font-bold hover:bg-slate-800 transition-colors">
                {loadingAI ? 'Thinking...' : '⚡ SAT Practice'}
              </button>
            </div>
          </div>

          {/* BACK */}
          <div className="absolute inset-0 bg-white rounded-[3rem] shadow-xl p-10 flex flex-col backface-hidden rotate-y-180 border border-slate-100 overflow-y-auto">
            {satQuestion ? (
              <div className="space-y-4">
                <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest">SAT Context Practice</h3>
                <p className="text-lg font-medium text-slate-800 leading-relaxed">{satQuestion.q}</p>
                <div className="grid gap-2">
                  {satQuestion.options.map((opt, i) => (
                    <div key={i} className={`p-3 rounded-xl border-2 text-sm font-bold ${i === satQuestion.correct ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                      {opt}
                    </div>
                  ))}
                </div>
                <button onClick={() => setSatQuestion(null)} className="w-full py-3 text-slate-400 text-xs font-bold hover:text-slate-900">Return to Word Detail</button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Definition</h3>
                  <p className="text-2xl font-bold text-slate-900 leading-tight">{word.definition}</p>
                </div>
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Context</h3>
                  <p className="text-slate-600 italic">"{word.example}"</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {word.synonyms.map(s => (
                    <span key={s} className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-xs font-bold text-slate-500">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-center text-xs font-black text-slate-400 uppercase tracking-widest">Rate your confidence</p>
        <div className="grid grid-cols-4 gap-3">
          {(Object.keys(MASTERY_COLORS) as unknown as MasteryLevel[]).map(lvl => (
            <button
              key={lvl}
              onClick={() => handleLevelSelect(lvl)}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${level === lvl ? 'border-slate-900 ring-2 ring-slate-900 ring-offset-2' : 'border-slate-100 bg-white hover:border-slate-200'}`}
            >
              <span className={`w-3 h-3 rounded-full ${MASTERY_COLORS[lvl].bg.replace('-50', '-500')}`}></span>
              <span className="text-[10px] font-black text-slate-900">{lvl + 1}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Flashcards;
