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

const Flashcards: React.FC<FlashcardsProps> = ({ words, currentMastery, onWordUpdate, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingImg, setLoadingImg] = useState(false);
  const [satQ, setSatQ] = useState<any>(null);
  const [img, setImg] = useState<string | null>(null);
  const [ans, setAns] = useState<number | null>(null);

  const word = words[currentIndex];
  const level = currentMastery[word.id] ?? 0;
  const config = MASTERY_COLORS[level as MasteryLevel];

  useEffect(() => { setIsFlipped(false); setSatQ(null); setImg(null); setAns(null); }, [currentIndex]);

  const handleLevel = (lvl: MasteryLevel) => { onWordUpdate(word.id, lvl); currentIndex < words.length - 1 ? setCurrentIndex(prev => prev + 1) : onBack(); };

  const speak = async () => {
    const b64 = await generateSpeech(`${word.term}. ${word.definition}`);
    const ctx = new AudioContext({ sampleRate: 24000 });
    const buf = await decodeAudioData(decode(b64), ctx, 24000, 1);
    const src = ctx.createBufferSource(); src.buffer = buf; src.connect(ctx.destination); src.start();
  };

  const drill = async () => { setLoadingAI(true); setIsFlipped(true); try { setSatQ(await generateSATQuestion(word.term, word.definition)); } finally { setLoadingAI(false); } };
  const vision = async () => { setLoadingImg(true); try { setImg(await generateWordImage(word.term, word.definition)); } finally { setLoadingImg(false); } };

  return (
    <div className="max-w-2xl mx-auto flex flex-col min-h-[85vh] pb-24">
      <header className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="text-[10px] font-black uppercase tracking-widest text-slate-400">← Exit Lab</button>
        <span className="text-[10px] font-black text-indigo-600">{currentIndex + 1} / {words.length}</span>
      </header>

      <div className="relative flex-1 perspective-1000">
        <div className={`relative w-full h-[36rem] transition-all duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          <div onClick={() => setIsFlipped(true)} className={`absolute inset-0 bg-white rounded-[4rem] shadow-2xl p-12 flex flex-col items-center justify-center backface-hidden border-[6px] ${config.border} cursor-pointer`}>
            <div className="absolute top-10 flex gap-4">
              <button onClick={(e) => { e.stopPropagation(); speak(); }} className="w-12 h-12 bg-slate-900 text-white rounded-full">🔊</button>
              <button onClick={(e) => { e.stopPropagation(); vision(); }} className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full">{loadingImg ? '⏳' : '🎨'}</button>
            </div>
            {img && <img src={img} className="w-full h-56 object-cover rounded-3xl mb-8" />}
            <h2 className={`text-7xl font-black text-center tracking-tighter mb-4 ${config.text}`}>{word.term}</h2>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">[{word.partOfSpeech}]</p>
          </div>
          <div className={`absolute inset-0 bg-white rounded-[4rem] shadow-2xl p-10 flex flex-col backface-hidden rotate-y-180 border-[6px] ${config.border} overflow-y-auto no-scrollbar`}>
            {satQ ? (
              <div className="space-y-6">
                <p className="font-bold text-slate-800">"{satQ.question}"</p>
                <div className="space-y-2">
                  {satQ.options.map((o: string, i: number) => (
                    <button key={i} onClick={() => setAns(i)} disabled={ans !== null} className={`w-full p-4 rounded-xl text-left font-bold ${ans === null ? 'border-2 border-slate-100' : i === satQ.correctIndex ? 'bg-emerald-50 border-emerald-500' : i === ans ? 'bg-rose-50 border-rose-500' : 'opacity-50'}`}>{o}</button>
                  ))}
                </div>
                {ans !== null && <p className="text-xs italic text-slate-500">{satQ.explanation}</p>}
              </div>
            ) : (
              <div className="space-y-8 text-center pt-8">
                <p className={`text-3xl font-black leading-tight ${config.text}`}>{word.definition}</p>
                <div className="p-6 bg-slate-50 rounded-3xl italic text-slate-600">"{word.example}"</div>
                <button onClick={drill} className="w-full py-4 bg-slate-950 text-white rounded-2xl font-black uppercase text-[10px]">{loadingAI ? 'Reasoning...' : 'Neural Drill ⚡'}</button>
              </div>
            )}
            <button onClick={() => setIsFlipped(false)} className="mt-auto py-4 text-slate-400 font-black text-[10px] uppercase">Back to Term</button>
          </div>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-4 gap-4">
        {[0, 1, 2, 3].map(lvl => (
          <button key={lvl} onClick={() => handleLevel(lvl as MasteryLevel)} className={`py-6 rounded-3xl border-2 ${level === lvl ? 'bg-slate-950 text-white shadow-xl' : 'bg-white border-slate-100'}`}>
            <span className="text-[10px] font-black uppercase">Lvl {lvl + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
export default Flashcards;