
import React, { useState, useEffect } from 'react';
import { Word } from '../../types';
import { generateWordImage } from '../../services/gemini';

interface VisualVibeProps {
  words: Word[];
  onBack: () => void;
  onXP: (amount: number) => void;
}

const VisualVibe: React.FC<VisualVibeProps> = ({ words, onBack, onXP }) => {
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [options, setOptions] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [streak, setStreak] = useState(0);

  const startNextRound = async () => {
    setLoading(true);
    setIsAnswered(false);
    setSelectedId(null);
    setImageUrl(null);

    const randomWord = words[Math.floor(Math.random() * words.length)];
    setCurrentWord(randomWord);

    const otherOptions = words
      .filter(w => w.id !== randomWord.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    
    setOptions([randomWord, ...otherOptions].sort(() => 0.5 - Math.random()));

    try {
      const url = await generateWordImage(randomWord.term, randomWord.definition);
      setImageUrl(url);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    startNextRound();
  }, [words]);

  const handleSelect = (id: string) => {
    if (isAnswered) return;
    setSelectedId(id);
    setIsAnswered(true);

    if (id === currentWord?.id) {
      setStreak(s => s + 1);
      onXP(25);
    } else {
      setStreak(0);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-in slide-in-from-right-10 duration-500 pb-12">
      <header className="flex justify-between items-center text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] px-4">
        <button onClick={onBack} className="hover:text-slate-950 transition-colors bg-white px-5 py-2 rounded-full border border-slate-100">← Exit Arena</button>
        <span className="text-rose-500 bg-rose-50 px-5 py-2 rounded-full border border-rose-100">Streak: {streak} 🔥</span>
      </header>

      <div className="bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-slate-100 relative min-h-[28rem] flex flex-col transition-all">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-16 space-y-6">
            <div className="w-16 h-16 border-[6px] border-indigo-600 border-t-transparent rounded-full animate-spin shadow-xl"></div>
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.4em] animate-pulse">Painting Prompt Data...</p>
          </div>
        ) : (
          <>
            <div className="relative h-80 w-full bg-slate-950">
              {imageUrl ? (
                <img src={imageUrl} alt="Guess the word" className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
                   <div className="text-5xl">🌫️</div>
                   <p className="text-[10px] font-black uppercase tracking-widest">Image Protocol Failed</p>
                </div>
              )}
              {isAnswered && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-10 text-center animate-in fade-in duration-500">
                  <div className="space-y-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.5em] text-indigo-400">Target Resolution</p>
                    <h3 className="text-5xl font-black text-white italic tracking-tighter uppercase">{currentWord?.term}</h3>
                    <p className="text-sm text-slate-300 font-medium italic leading-relaxed px-4">{currentWord?.definition}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-10 space-y-4">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] text-center mb-4">Select the corresponding unit</p>
              <div className="grid grid-cols-2 gap-4">
                {options.map(opt => {
                  let styles = "p-5 rounded-3xl border-2 font-black transition-all text-xs tracking-tight uppercase ";
                  if (isAnswered) {
                    if (opt.id === currentWord?.id) styles += "bg-emerald-600 border-emerald-700 text-white scale-105 shadow-xl";
                    else if (opt.id === selectedId) styles += "bg-rose-600 border-rose-700 text-white opacity-40";
                    else styles += "bg-slate-50 border-transparent text-slate-300 scale-95 opacity-20";
                  } else {
                    styles += "bg-white border-slate-100 hover:border-indigo-600 hover:text-indigo-600 hover:shadow-lg active:scale-95";
                  }

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelect(opt.id)}
                      disabled={isAnswered}
                      className={styles}
                    >
                      {opt.term}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {isAnswered && (
        <button
          onClick={startNextRound}
          className="w-full bg-slate-950 text-white py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] hover:bg-indigo-600 transition-all shadow-2xl active:scale-95 animate-in slide-in-from-bottom-4"
        >
          Next Challenge →
        </button>
      )}
    </div>
  );
};

export default VisualVibe;
